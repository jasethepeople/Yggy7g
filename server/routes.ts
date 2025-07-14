import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, optionalAuth, hashPassword, generateShareToken } from "./auth";
import passport from "passport";
import multer from "multer";
import { 
  generateFromTextSchema, 
  generateFromImageSchema,
  registerSchema,
  loginSchema,
  createFolderSchema,
  updateFolderSchema,
  sharePatternSchema,
} from "@shared/schema";
import { generateImageFromText, analyzeImageForPattern, generatePatternInstructions } from "./services/openai";
import { PatternGenerator } from "./services/patternGenerator";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set session secret if not provided
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "super-secret-session-key-for-development-only";
  }

  // Setup authentication
  setupAuth(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          error: "Username already taken",
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({
        success: false,
        error: "Registration failed",
      });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          error: info?.message || "Invalid credentials",
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        
        const { passwordHash: _, ...userWithoutPassword } = user;
        return res.json({
          success: true,
          user: userWithoutPassword,
          message: "Login successful",
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Logout failed",
        });
      }
      res.json({
        success: true,
        message: "Logout successful",
      });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user information",
      });
    }
  });

  // Folder management routes
  app.get("/api/folders", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const parentFolderId = req.query.parent ? parseInt(req.query.parent as string) : undefined;
      const folders = await storage.getUserFolders(user.id, parentFolderId);
      
      res.json({
        success: true,
        folders,
      });
    } catch (error) {
      console.error("Get folders error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch folders",
      });
    }
  });

  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = createFolderSchema.parse(req.body);
      
      const folder = await storage.createFolder({
        ...validatedData,
        userId: user.id,
      });
      
      res.json({
        success: true,
        folder,
        message: "Folder created successfully",
      });
    } catch (error) {
      console.error("Create folder error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create folder",
      });
    }
  });

  app.patch("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const folderId = parseInt(req.params.id);
      const validatedData = updateFolderSchema.parse(req.body);
      
      // Check folder ownership
      const existingFolder = await storage.getFolder(folderId);
      if (!existingFolder || existingFolder.userId !== user.id) {
        return res.status(404).json({
          success: false,
          error: "Folder not found",
        });
      }
      
      const folder = await storage.updateFolder(folderId, validatedData);
      
      res.json({
        success: true,
        folder,
        message: "Folder updated successfully",
      });
    } catch (error) {
      console.error("Update folder error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to update folder",
      });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const folderId = parseInt(req.params.id);
      
      // Check folder ownership
      const existingFolder = await storage.getFolder(folderId);
      if (!existingFolder || existingFolder.userId !== user.id) {
        return res.status(404).json({
          success: false,
          error: "Folder not found",
        });
      }
      
      const success = await storage.deleteFolder(folderId);
      
      if (success) {
        res.json({
          success: true,
          message: "Folder deleted successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to delete folder",
        });
      }
    } catch (error) {
      console.error("Delete folder error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete folder",
      });
    }
  });

  // Pattern sharing routes
  app.post("/api/patterns/:id/share", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const patternId = parseInt(req.params.id);
      const validatedData = sharePatternSchema.parse({
        ...req.body,
        patternId,
      });
      
      // Check pattern ownership
      const pattern = await storage.getPattern(patternId);
      if (!pattern || pattern.userId !== user.id) {
        return res.status(404).json({
          success: false,
          error: "Pattern not found",
        });
      }
      
      const shareToken = generateShareToken();
      const share = await storage.createShare({
        ...validatedData,
        sharedByUserId: user.id,
        shareToken,
      });
      
      res.json({
        success: true,
        share,
        shareToken,
        message: "Pattern shared successfully",
      });
    } catch (error) {
      console.error("Share pattern error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to share pattern",
      });
    }
  });

  app.get("/api/patterns/shared", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const sharedPatterns = await storage.getSharedPatterns(user.id);
      
      res.json({
        success: true,
        patterns: sharedPatterns,
      });
    } catch (error) {
      console.error("Get shared patterns error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch shared patterns",
      });
    }
  });

  app.get("/api/patterns/my", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;
      const patterns = await storage.getUserPatterns(user.id, folderId);
      
      res.json({
        success: true,
        patterns,
      });
    } catch (error) {
      console.error("Get user patterns error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patterns",
      });
    }
  });
  // Generate pattern from text description
  app.post("/api/patterns/generate-from-text", optionalAuth, async (req, res) => {
    try {
      const validatedData = generateFromTextSchema.parse(req.body);
      
      // Generate image using DALL-E
      const generatedImage = await generateImageFromText(validatedData.description);
      
      // Create pattern grid
      const patternGrid = PatternGenerator.generateFromDescription(
        validatedData.description,
        validatedData.width,
        validatedData.height,
        validatedData.complexity,
        validatedData.colorPalette,
        validatedData.colors
      );

      // Calculate metrics
      const metrics = PatternGenerator.calculateMetrics(patternGrid);

      // Generate AI analysis for instructions
      const analysis = await analyzeImageForPattern(
        generatedImage.url.split(',')[1] || '' // Extract base64 if data URL
      );

      // Generate detailed instructions
      const instructions = await generatePatternInstructions(patternGrid, analysis);

      // Save pattern to storage
      const user = req.user as any;
      const pattern = await storage.createPattern({
        name: `Generated Pattern - ${new Date().toLocaleDateString()}`,
        description: validatedData.description,
        imageUrl: generatedImage.url,
        generatedImageData: generatedImage.url,
        patternData: patternGrid,
        stitchCount: metrics.totalStitches,
        estimatedTime: metrics.estimatedTime,
        difficulty: metrics.difficulty,
        yarnUsage: metrics.yarnUsage,
        colorPalette: validatedData.colors || [],
        width: validatedData.width,
        height: validatedData.height,
        complexity: validatedData.complexity,
        instructions: instructions,
        yarnWeight: validatedData.yarnWeight,
        materialType: validatedData.materialType,
        fiberType: validatedData.fiberType,
        userId: user?.id || null,
        folderId: null,
        isPublic: !user,
      });

      res.json({
        success: true,
        pattern,
        metrics,
        generatedImage,
      });
    } catch (error) {
      console.error("Error generating pattern from text:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate pattern",
      });
    }
  });

  // Generate pattern from uploaded image
  app.post("/api/patterns/generate-from-image", optionalAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      // Convert file to base64
      const base64Image = req.file.buffer.toString('base64');
      
      const validatedData = generateFromImageSchema.parse({
        imageData: base64Image,
        width: parseInt(req.body.width) || 40,
        height: parseInt(req.body.height) || 50,
        enhanceColors: req.body.enhanceColors === 'true',
        simplifyDetails: req.body.simplifyDetails === 'true',
      });

      // Analyze image for pattern characteristics
      const analysis = await analyzeImageForPattern(validatedData.imageData);

      // Generate pattern grid from image
      const patternGrid = PatternGenerator.generateFromImage(
        validatedData.imageData,
        validatedData.width,
        validatedData.height,
        validatedData.enhanceColors,
        validatedData.simplifyDetails
      );

      // Calculate metrics
      const metrics = PatternGenerator.calculateMetrics(patternGrid);

      // Generate detailed instructions
      const instructions = await generatePatternInstructions(patternGrid, analysis);

      // Save pattern to storage
      const user = req.user as any;
      const pattern = await storage.createPattern({
        name: `Uploaded Pattern - ${new Date().toLocaleDateString()}`,
        description: "Pattern generated from uploaded image",
        imageUrl: `data:${req.file.mimetype};base64,${base64Image}`,
        generatedImageData: `data:${req.file.mimetype};base64,${base64Image}`,
        patternData: patternGrid,
        stitchCount: metrics.totalStitches,
        estimatedTime: metrics.estimatedTime,
        difficulty: metrics.difficulty,
        yarnUsage: metrics.yarnUsage,
        colorPalette: analysis.colorRegions.map(cr => cr.color),
        width: validatedData.width,
        height: validatedData.height,
        complexity: analysis.complexity,
        instructions: instructions,
        yarnWeight: validatedData.yarnWeight,
        materialType: validatedData.materialType,
        fiberType: validatedData.fiberType,
        userId: user?.id || null,
        folderId: null,
        isPublic: !user,
      });

      res.json({
        success: true,
        pattern,
        metrics,
        analysis,
      });
    } catch (error) {
      console.error("Error generating pattern from image:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate pattern from image",
      });
    }
  });

  // Get pattern by ID
  app.get("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pattern = await storage.getPattern(id);
      
      if (!pattern) {
        return res.status(404).json({
          success: false,
          error: "Pattern not found",
        });
      }

      res.json({
        success: true,
        pattern,
      });
    } catch (error) {
      console.error("Error fetching pattern:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch pattern",
      });
    }
  });

  // Get all patterns (recent patterns)
  app.get("/api/patterns", async (req, res) => {
    try {
      const patterns = await storage.getRecentPatterns(10);
      res.json({
        success: true,
        patterns,
      });
    } catch (error) {
      console.error("Error fetching patterns:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patterns",
      });
    }
  });

  // Create pattern manually
  app.post("/api/patterns", async (req, res) => {
    try {
      const patternData = req.body;
      const pattern = await storage.createPattern(patternData);
      
      res.status(201).json({
        success: true,
        pattern,
      });
    } catch (error) {
      console.error("Error creating pattern:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pattern",
      });
    }
  });

  // Update pattern
  app.patch("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const pattern = await storage.updatePattern(id, updates);
      
      if (!pattern) {
        return res.status(404).json({
          success: false,
          error: "Pattern not found",
        });
      }

      res.json({
        success: true,
        pattern,
      });
    } catch (error) {
      console.error("Error updating pattern:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update pattern",
      });
    }
  });

  // Delete pattern
  app.delete("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePattern(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Pattern not found",
        });
      }

      res.json({
        success: true,
        message: "Pattern deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting pattern:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete pattern",
      });
    }
  });

  // Validate pattern
  app.post("/api/patterns/validate", async (req, res) => {
    try {
      const { patternData } = req.body;
      const validation = PatternGenerator.validatePattern(patternData);
      
      res.json({
        success: true,
        validation,
      });
    } catch (error) {
      console.error("Error validating pattern:", error);
      res.status(400).json({
        success: false,
        error: "Failed to validate pattern",
      });
    }
  });

  // Export pattern as PDF (placeholder - would integrate with PDF generation library)
  app.get("/api/patterns/:id/export/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pattern = await storage.getPattern(id);
      
      if (!pattern) {
        return res.status(404).json({
          success: false,
          error: "Pattern not found",
        });
      }

      // In a real implementation, this would generate a PDF
      res.json({
        success: true,
        message: "PDF export functionality would be implemented here",
        downloadUrl: `/api/patterns/${id}/download/pdf`,
      });
    } catch (error) {
      console.error("Error exporting pattern:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export pattern",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

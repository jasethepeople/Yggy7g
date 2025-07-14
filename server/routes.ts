import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { generateFromTextSchema, generateFromImageSchema } from "@shared/schema";
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
  // Generate pattern from text description
  app.post("/api/patterns/generate-from-text", async (req, res) => {
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
      const pattern = await storage.createPattern({
        name: `Generated Pattern - ${new Date().toLocaleDateString()}`,
        description: validatedData.description,
        imageUrl: generatedImage.url,
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
  app.post("/api/patterns/generate-from-image", upload.single('image'), async (req, res) => {
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
      const pattern = await storage.createPattern({
        name: `Uploaded Pattern - ${new Date().toLocaleDateString()}`,
        description: "Pattern generated from uploaded image",
        imageUrl: `data:${req.file.mimetype};base64,${base64Image}`,
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

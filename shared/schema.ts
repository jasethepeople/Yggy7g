import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  generatedImageData: text("generated_image_data"),
  patternData: jsonb("pattern_data").notNull(),
  stitchCount: integer("stitch_count").default(0),
  estimatedTime: text("estimated_time"),
  difficulty: text("difficulty").notNull(),
  yarnUsage: jsonb("yarn_usage"),
  colorPalette: jsonb("color_palette"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  complexity: text("complexity").notNull(),
  instructions: text("instructions"),
  yarnWeight: text("yarn_weight").default("medium"),
  materialType: text("material_type").default("yarn"),
  fiberType: text("fiber_type").default("acrylic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
});

export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = typeof patterns.$inferSelect;

// Stitch types for pattern generation
export const StitchType = z.enum([
  "sc", // single crochet
  "dc", // double crochet
  "hdc", // half double crochet
  "tc", // treble crochet
  "sl", // slip stitch
  "ch", // chain
  "inc", // increase
  "dec", // decrease
]);

export type StitchType = z.infer<typeof StitchType>;

// Pattern grid cell structure
export const PatternCell = z.object({
  x: z.number(),
  y: z.number(),
  stitch: StitchType,
  color: z.string(),
});

export type PatternCell = z.infer<typeof PatternCell>;

// Color palette structure
export const ColorPalette = z.object({
  name: z.string(),
  colors: z.array(z.string()),
});

export type ColorPalette = z.infer<typeof ColorPalette>;

// Yarn and material types
export const YarnWeight = z.enum([
  "lace", // 0: Lace weight (10 count crochet thread)
  "super-fine", // 1: Super Fine (sock, fingering, baby)
  "fine", // 2: Fine (sport, baby)
  "light", // 3: Light (DK, light worsted)
  "medium", // 4: Medium (worsted, afghan, aran)
  "bulky", // 5: Bulky (chunky, craft, rug)
  "super-bulky", // 6: Super Bulky (roving)
  "jumbo", // 7: Jumbo (roving)
]);

export const MaterialType = z.enum([
  "yarn", // Traditional yarn
  "thread", // Crochet thread
  "string", // Craft string
  "rope", // Rope/cord
  "fabric-strips", // Fabric strips
  "wire", // Craft wire
  "plastic", // Plastic yarn/strips
]);

export const FiberType = z.enum([
  "acrylic",
  "cotton", 
  "wool",
  "bamboo",
  "silk",
  "alpaca",
  "mohair",
  "linen",
  "polyester",
  "nylon",
  "blend",
  "other",
]);

export type YarnWeight = z.infer<typeof YarnWeight>;
export type MaterialType = z.infer<typeof MaterialType>;
export type FiberType = z.infer<typeof FiberType>;

// Generation request schemas
export const generateFromTextSchema = z.object({
  description: z.string().min(1),
  width: z.number().min(10).max(200),
  height: z.number().min(10).max(200),
  complexity: z.enum(["simple", "intermediate", "advanced"]),
  colorPalette: z.string(),
  colors: z.array(z.string()).optional(),
  yarnWeight: YarnWeight.default("medium"),
  materialType: MaterialType.default("yarn"),
  fiberType: FiberType.default("acrylic"),
});

export const generateFromImageSchema = z.object({
  imageData: z.string(), // base64 encoded image
  width: z.number().min(10).max(200),
  height: z.number().min(10).max(200),
  enhanceColors: z.boolean().default(true),
  simplifyDetails: z.boolean().default(true),
  yarnWeight: YarnWeight.default("medium"),
  materialType: MaterialType.default("yarn"),
  fiberType: FiberType.default("acrylic"),
});

export type GenerateFromTextRequest = z.infer<typeof generateFromTextSchema>;
export type GenerateFromImageRequest = z.infer<typeof generateFromImageSchema>;

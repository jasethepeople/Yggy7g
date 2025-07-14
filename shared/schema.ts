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

// Generation request schemas
export const generateFromTextSchema = z.object({
  description: z.string().min(1),
  width: z.number().min(10).max(200),
  height: z.number().min(10).max(200),
  complexity: z.enum(["simple", "intermediate", "advanced"]),
  colorPalette: z.string(),
  colors: z.array(z.string()).optional(),
});

export const generateFromImageSchema = z.object({
  imageData: z.string(), // base64 encoded image
  width: z.number().min(10).max(200),
  height: z.number().min(10).max(200),
  enhanceColors: z.boolean().default(true),
  simplifyDetails: z.boolean().default(true),
});

export type GenerateFromTextRequest = z.infer<typeof generateFromTextSchema>;
export type GenerateFromImageRequest = z.infer<typeof generateFromImageSchema>;

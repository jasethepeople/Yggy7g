import { z } from "zod";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, decimal, uuid } from "drizzle-orm/pg-core";

// Advanced Crochet Techniques
export const CrochetTechnique = z.enum([
  "single-crochet", "double-crochet", "half-double-crochet", "treble-crochet",
  "slip-stitch", "chain", "increase", "decrease", "front-post", "back-post",
  "bobble", "popcorn", "cluster", "shell", "fan", "granny-square",
  "tunisian", "tapestry", "intarsia", "fair-isle", "mosaic", "overlay",
  "broomstick-lace", "hairpin-lace", "irish-lace", "freeform", "amigurumi"
]);

// Yarn Brands and Types
export const YarnBrand = z.enum([
  "red-heart", "lion-brand", "bernat", "caron", "patons", "premier",
  "cascade", "malabrigo", "rowan", "debbie-bliss", "noro", "lang",
  "scheepjes", "stylecraft", "wendy", "king-cole", "sirdar", "rico",
  "katia", "drops", "phildar", "bergere-de-france", "other"
]);

// Advanced Pattern Features
export const patterns = pgTable("patterns_advanced", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  patternData: jsonb("pattern_data"),
  
  // Advanced pattern properties
  techniques: jsonb("techniques").$type<string[]>(),
  skillLevel: varchar("skill_level", { length: 50 }),
  estimatedTime: varchar("estimated_time", { length: 100 }),
  difficulty: integer("difficulty").default(1), // 1-10 scale
  
  // Yarn and materials
  yarnBrand: varchar("yarn_brand", { length: 100 }),
  yarnWeight: varchar("yarn_weight", { length: 50 }),
  yarnAmount: decimal("yarn_amount", { precision: 10, scale: 2 }),
  yarnUnit: varchar("yarn_unit", { length: 20 }).default("yards"),
  hookSize: varchar("hook_size", { length: 20 }),
  additionalMaterials: jsonb("additional_materials").$type<string[]>(),
  
  // Pattern metadata
  stitchCount: integer("stitch_count"),
  rowCount: integer("row_count"),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  gauge: varchar("gauge", { length: 100 }),
  
  // Community features
  authorId: integer("author_id"),
  isPublic: boolean("is_public").default(false),
  downloads: integer("downloads").default(0),
  favorites: integer("favorites").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0),
  
  // Version control
  version: varchar("version", { length: 20 }).default("1.0.0"),
  parentPatternId: integer("parent_pattern_id"),
  
  // Shopping and recommendations
  shoppingList: jsonb("shopping_list"),
  yarnSubstitutes: jsonb("yarn_substitutes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Advanced Stitch Library
export const stitches = pgTable("stitches", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 10 }),
  technique: varchar("technique", { length: 50 }),
  difficulty: integer("difficulty"),
  description: text("description"),
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  diagramUrl: text("diagram_url"),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Color Palettes with Yarn Brands
export const colorPalettes = pgTable("color_palettes", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  colors: jsonb("colors").$type<{
    hex: string;
    name: string;
    yarnBrand?: string;
    yarnColor?: string;
    substitute?: string;
  }[]>(),
  isPublic: boolean("is_public").default(false),
  authorId: integer("author_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Community Features
export const patternCollaborations = pgTable("pattern_collaborations", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  patternId: integer("pattern_id").notNull(),
  userId: integer("user_id").notNull(),
  role: varchar("role", { length: 50 }).default("collaborator"), // owner, collaborator, viewer
  permissions: jsonb("permissions").$type<string[]>(),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at")
});

export const patternVersions = pgTable("pattern_versions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  patternId: integer("pattern_id").notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  changes: text("changes"),
  patternData: jsonb("pattern_data"),
  authorId: integer("author_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const progressTracking = pgTable("progress_tracking", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  patternId: integer("pattern_id").notNull(),
  currentRow: integer("current_row").default(1),
  currentStitch: integer("current_stitch").default(1),
  completedSections: jsonb("completed_sections").$type<string[]>(),
  notes: text("notes"),
  timeSpent: integer("time_spent").default(0), // minutes
  difficulty: integer("difficulty"), // user's perceived difficulty
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

export const yarnDatabase = pgTable("yarn_database", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  brand: varchar("brand", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  weight: varchar("weight", { length: 50 }),
  fiber: varchar("fiber", { length: 200 }),
  yardage: integer("yardage"),
  weight_grams: integer("weight_grams"),
  colors: jsonb("colors").$type<{hex: string; name: string; number?: string}[]>(),
  price: decimal("price", { precision: 10, scale: 2 }),
  availability: varchar("availability", { length: 50 }),
  substitutes: jsonb("substitutes").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Shopping Lists
export const shoppingLists = pgTable("shopping_lists", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  patternId: integer("pattern_id"),
  name: varchar("name", { length: 200 }).notNull(),
  items: jsonb("items").$type<{
    type: 'yarn' | 'hook' | 'accessory';
    name: string;
    brand?: string;
    color?: string;
    quantity: number;
    unit: string;
    price?: number;
    url?: string;
    purchased: boolean;
  }[]>(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schema types
export type AdvancedPattern = typeof patterns.$inferSelect;
export type InsertAdvancedPattern = typeof patterns.$inferInsert;
export type Stitch = typeof stitches.$inferSelect;
export type ColorPalette = typeof colorPalettes.$inferSelect;
export type PatternCollaboration = typeof patternCollaborations.$inferSelect;
export type PatternVersion = typeof patternVersions.$inferSelect;
export type ProgressTracking = typeof progressTracking.$inferSelect;
export type YarnInfo = typeof yarnDatabase.$inferSelect;
export type ShoppingList = typeof shoppingLists.$inferSelect;

// Advanced request schemas
export const createAdvancedPatternSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  techniques: z.array(CrochetTechnique),
  yarnBrand: YarnBrand.optional(),
  yarnWeight: z.string().optional(),
  yarnAmount: z.number().positive().optional(),
  hookSize: z.string().optional(),
  difficulty: z.number().min(1).max(10),
  isPublic: z.boolean().default(false)
});

export const collaborationInviteSchema = z.object({
  patternId: z.number(),
  userId: z.number(),
  role: z.enum(["owner", "collaborator", "viewer"]),
  permissions: z.array(z.string())
});

export const progressUpdateSchema = z.object({
  patternId: z.number(),
  currentRow: z.number().optional(),
  currentStitch: z.number().optional(),
  completedSections: z.array(z.string()).optional(),
  notes: z.string().optional(),
  timeSpent: z.number().optional(),
  difficulty: z.number().min(1).max(10).optional()
});

export const shoppingListSchema = z.object({
  patternId: z.number().optional(),
  name: z.string().min(1),
  items: z.array(z.object({
    type: z.enum(['yarn', 'hook', 'accessory']),
    name: z.string(),
    brand: z.string().optional(),
    color: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.string(),
    price: z.number().optional(),
    url: z.string().optional(),
    purchased: z.boolean().default(false)
  }))
});

export type CreateAdvancedPatternRequest = z.infer<typeof createAdvancedPatternSchema>;
export type CollaborationInviteRequest = z.infer<typeof collaborationInviteSchema>;
export type ProgressUpdateRequest = z.infer<typeof progressUpdateSchema>;
export type ShoppingListRequest = z.infer<typeof shoppingListSchema>;
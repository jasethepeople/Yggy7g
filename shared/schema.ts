import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication and pattern ownership
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Folders for organizing patterns
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentFolderId: integer("parent_folder_id"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patterns table with user ownership and folder organization
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
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").default(false),
  shareToken: varchar("share_token", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pattern shares for collaborative access
export const patternShares = pgTable("pattern_shares", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id").notNull().references(() => patterns.id, { onDelete: "cascade" }),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
  sharedByUserId: integer("shared_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: varchar("permission", { length: 20 }).notNull().default("view"), // view, edit
  shareToken: varchar("share_token", { length: 64 }),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patterns: many(patterns),
  folders: many(folders),
  sharedPatterns: many(patternShares, { relationName: "sharedBy" }),
  receivedShares: many(patternShares, { relationName: "sharedWith" }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentFolderId], references: [folders.id], relationName: "parentChild" }),
  children: many(folders, { relationName: "parentChild" }),
  patterns: many(patterns),
}));

export const patternsRelations = relations(patterns, ({ one, many }) => ({
  user: one(users, { fields: [patterns.userId], references: [users.id] }),
  folder: one(folders, { fields: [patterns.folderId], references: [folders.id] }),
  shares: many(patternShares),
}));

export const patternSharesRelations = relations(patternShares, ({ one }) => ({
  pattern: one(patterns, { fields: [patternShares.patternId], references: [patterns.id] }),
  sharedWith: one(users, { fields: [patternShares.sharedWithUserId], references: [users.id], relationName: "sharedWith" }),
  sharedBy: one(users, { fields: [patternShares.sharedByUserId], references: [users.id], relationName: "sharedBy" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatternShareSchema = createInsertSchema(patternShares).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Pattern = typeof patterns.$inferSelect;
export type InsertPattern = z.infer<typeof insertPatternSchema>;

export type PatternShare = typeof patternShares.$inferSelect;
export type InsertPatternShare = z.infer<typeof insertPatternShareSchema>;

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

// Authentication schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Folder management schemas
export const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentFolderId: z.number().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateFolderSchema = createFolderSchema.partial();

// Pattern sharing schemas
export const sharePatternSchema = z.object({
  patternId: z.number(),
  sharedWithUserId: z.number().optional(),
  permission: z.enum(["view", "edit"]).default("view"),
  isPublic: z.boolean().optional().default(false),
});

export type GenerateFromTextRequest = z.infer<typeof generateFromTextSchema>;
export type GenerateFromImageRequest = z.infer<typeof generateFromImageSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateFolderRequest = z.infer<typeof createFolderSchema>;
export type UpdateFolderRequest = z.infer<typeof updateFolderSchema>;
export type SharePatternRequest = z.infer<typeof sharePatternSchema>;

import {
  patterns,
  users,
  folders,
  patternShares,
  type Pattern,
  type InsertPattern,
  type User,
  type InsertUser,
  type Folder,
  type InsertFolder,
  type PatternShare,
  type InsertPatternShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, like } from "drizzle-orm";

export interface IStorage {
  // Pattern operations
  getPattern(id: number): Promise<Pattern | undefined>;
  createPattern(pattern: InsertPattern): Promise<Pattern>;
  updatePattern(id: number, updates: Partial<InsertPattern>): Promise<Pattern | undefined>;
  deletePattern(id: number): Promise<boolean>;
  getRecentPatterns(limit: number): Promise<Pattern[]>;
  searchPatterns(query: string): Promise<Pattern[]>;
  getUserPatterns(userId: number, folderId?: number): Promise<Pattern[]>;
  getPublicPatterns(limit: number): Promise<Pattern[]>;
  getSharedPatterns(userId: number): Promise<Pattern[]>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Folder operations
  getFolder(id: number): Promise<Folder | undefined>;
  getUserFolders(userId: number, parentFolderId?: number): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;

  // Sharing operations
  createShare(share: InsertPatternShare): Promise<PatternShare>;
  getPatternShares(patternId: number): Promise<PatternShare[]>;
  getSharedWithUser(userId: number): Promise<PatternShare[]>;
  deleteShare(id: number): Promise<boolean>;
  getShareByToken(token: string): Promise<PatternShare | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getPattern(id: number): Promise<Pattern | undefined> {
    const [pattern] = await db.select().from(patterns).where(eq(patterns.id, id));
    return pattern || undefined;
  }

  async createPattern(insertPattern: InsertPattern): Promise<Pattern> {
    const [pattern] = await db
      .insert(patterns)
      .values(insertPattern)
      .returning();
    return pattern;
  }

  async updatePattern(id: number, updates: Partial<InsertPattern>): Promise<Pattern | undefined> {
    const [pattern] = await db
      .update(patterns)
      .set(updates)
      .where(eq(patterns.id, id))
      .returning();
    return pattern || undefined;
  }

  async deletePattern(id: number): Promise<boolean> {
    const result = await db.delete(patterns).where(eq(patterns.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getRecentPatterns(limit: number): Promise<Pattern[]> {
    return await db
      .select()
      .from(patterns)
      .orderBy(desc(patterns.createdAt))
      .limit(limit);
  }

  async searchPatterns(query: string): Promise<Pattern[]> {
    const queryLower = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(patterns)
      .where(
        or(
          like(patterns.name, queryLower),
          like(patterns.description, queryLower)
        )
      );
  }

  async getUserPatterns(userId: number, folderId?: number): Promise<Pattern[]> {
    const conditions = [eq(patterns.userId, userId)];
    if (folderId !== undefined) {
      conditions.push(eq(patterns.folderId, folderId));
    }
    
    return db
      .select()
      .from(patterns)
      .where(and(...conditions))
      .orderBy(desc(patterns.createdAt));
  }

  async getPublicPatterns(limit: number): Promise<Pattern[]> {
    return db
      .select()
      .from(patterns)
      .where(eq(patterns.isPublic, true))
      .orderBy(desc(patterns.createdAt))
      .limit(limit);
  }

  async getSharedPatterns(userId: number): Promise<Pattern[]> {
    return db
      .select({
        id: patterns.id,
        name: patterns.name,
        description: patterns.description,
        imageUrl: patterns.imageUrl,
        generatedImageData: patterns.generatedImageData,
        patternData: patterns.patternData,
        stitchCount: patterns.stitchCount,
        estimatedTime: patterns.estimatedTime,
        difficulty: patterns.difficulty,
        yarnUsage: patterns.yarnUsage,
        colorPalette: patterns.colorPalette,
        width: patterns.width,
        height: patterns.height,
        complexity: patterns.complexity,
        instructions: patterns.instructions,
        yarnWeight: patterns.yarnWeight,
        materialType: patterns.materialType,
        fiberType: patterns.fiberType,
        userId: patterns.userId,
        folderId: patterns.folderId,
        isPublic: patterns.isPublic,
        shareToken: patterns.shareToken,
        createdAt: patterns.createdAt,
        updatedAt: patterns.updatedAt,
      })
      .from(patterns)
      .innerJoin(patternShares, eq(patterns.id, patternShares.patternId))
      .where(eq(patternShares.sharedWithUserId, userId))
      .orderBy(desc(patterns.createdAt));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({...updates, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Folder operations
  async getFolder(id: number): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getUserFolders(userId: number, parentFolderId?: number): Promise<Folder[]> {
    const conditions = [eq(folders.userId, userId)];
    if (parentFolderId !== undefined) {
      conditions.push(eq(folders.parentFolderId, parentFolderId));
    }

    return db
      .select()
      .from(folders)
      .where(and(...conditions))
      .orderBy(asc(folders.name));
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values(insertFolder)
      .returning();
    return folder;
  }

  async updateFolder(id: number, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({...updates, updatedAt: new Date()})
      .where(eq(folders.id, id))
      .returning();
    return folder || undefined;
  }

  async deleteFolder(id: number): Promise<boolean> {
    const result = await db.delete(folders).where(eq(folders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Sharing operations
  async createShare(insertShare: InsertPatternShare): Promise<PatternShare> {
    const [share] = await db
      .insert(patternShares)
      .values(insertShare)
      .returning();
    return share;
  }

  async getPatternShares(patternId: number): Promise<PatternShare[]> {
    return db
      .select()
      .from(patternShares)
      .where(eq(patternShares.patternId, patternId));
  }

  async getSharedWithUser(userId: number): Promise<PatternShare[]> {
    return db
      .select()
      .from(patternShares)
      .where(eq(patternShares.sharedWithUserId, userId));
  }

  async deleteShare(id: number): Promise<boolean> {
    const result = await db.delete(patternShares).where(eq(patternShares.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getShareByToken(token: string): Promise<PatternShare | undefined> {
    const [share] = await db
      .select()
      .from(patternShares)
      .where(eq(patternShares.shareToken, token));
    return share || undefined;
  }
}

export const storage = new DatabaseStorage();

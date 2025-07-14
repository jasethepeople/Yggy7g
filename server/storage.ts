import { patterns, type Pattern, type InsertPattern } from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or } from "drizzle-orm";

export interface IStorage {
  getPattern(id: number): Promise<Pattern | undefined>;
  createPattern(pattern: InsertPattern): Promise<Pattern>;
  updatePattern(id: number, updates: Partial<InsertPattern>): Promise<Pattern | undefined>;
  deletePattern(id: number): Promise<boolean>;
  getRecentPatterns(limit: number): Promise<Pattern[]>;
  searchPatterns(query: string): Promise<Pattern[]>;
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
}

export const storage = new DatabaseStorage();

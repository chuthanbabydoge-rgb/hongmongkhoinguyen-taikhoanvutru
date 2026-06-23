import { eq, desc } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import type { Activity, CreateActivityRequest } from "../models/activity";
import { ActivityVisibility } from "../models/activity";
import type { IActivityRepository } from "./IActivityRepository";
import { db } from "@workspace/db";
import { activitiesTable } from "@workspace/db/schema";

function toModel(row: typeof activitiesTable.$inferSelect): Activity {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as Activity["type"],
    sourceApp: row.sourceApp,
    title: row.title,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    visibility: row.visibility as Activity["visibility"],
    createdAt: row.createdAt,
  };
}

export class SupabaseActivityRepository implements IActivityRepository {
  async create(input: CreateActivityRequest): Promise<Activity> {
    const rows = await db
      .insert(activitiesTable)
      .values({
        userId: input.userId,
        type: input.type,
        sourceApp: input.sourceApp,
        title: input.title,
        description: input.description ?? null,
        metadata: input.metadata ?? null,
        visibility: input.visibility ?? ActivityVisibility.PUBLIC,
      })
      .returning();
    return toModel(rows[0]!);
  }

  async getById(id: string): Promise<Activity | null> {
    const rows = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, id))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async getByUserId(userId: string, limit?: number, offset = 0): Promise<Activity[]> {
    let query = db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.userId, userId))
      .orderBy(desc(activitiesTable.createdAt))
      .offset(offset);

    if (limit !== undefined) {
      query = query.limit(limit) as typeof query;
    }

    const rows = await query;
    return rows.map(toModel);
  }

  async getFeed(limit: number, offset: number): Promise<Activity[]> {
    const rows = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.visibility, ActivityVisibility.PUBLIC))
      .orderBy(desc(activitiesTable.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(toModel);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await db.delete(activitiesTable).where(eq(activitiesTable.id, id));
    return true;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db
      .select({ value: drizzleCount() })
      .from(activitiesTable)
      .where(eq(activitiesTable.userId, userId));
    return result[0]?.value ?? 0;
  }
}

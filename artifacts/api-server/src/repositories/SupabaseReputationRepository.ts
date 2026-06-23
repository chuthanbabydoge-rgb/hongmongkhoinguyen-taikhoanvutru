import { eq, desc } from "drizzle-orm";
import type { Reputation, ReputationEvent } from "../models/reputation";
import { calculateLevel } from "../models/reputation";
import type { IReputationRepository } from "./IReputationRepository";
import { db } from "@workspace/db";
import { reputationsTable, reputationEventsTable } from "@workspace/db/schema";

function toReputationModel(row: typeof reputationsTable.$inferSelect): Reputation {
  return {
    id: row.id,
    userId: row.userId,
    score: row.score,
    level: row.level as Reputation["level"],
    positiveEvents: row.positiveEvents,
    negativeEvents: row.negativeEvents,
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toEventModel(row: typeof reputationEventsTable.$inferSelect): ReputationEvent {
  return {
    id: row.id,
    userId: row.userId,
    sourceApp: row.sourceApp,
    reason: row.reason,
    points: row.points,
    createdAt: row.createdAt,
  };
}

export class SupabaseReputationRepository implements IReputationRepository {
  async getByUserId(userId: string): Promise<Reputation | null> {
    const rows = await db
      .select()
      .from(reputationsTable)
      .where(eq(reputationsTable.userId, userId))
      .limit(1);
    return rows[0] ? toReputationModel(rows[0]) : null;
  }

  async create(userId: string): Promise<Reputation> {
    const rows = await db
      .insert(reputationsTable)
      .values({ userId, score: 0, level: "CITIZEN", positiveEvents: 0, negativeEvents: 0 })
      .returning();
    return toReputationModel(rows[0]!);
  }

  async update(reputation: Reputation): Promise<Reputation> {
    const rows = await db
      .update(reputationsTable)
      .set({
        score: reputation.score,
        level: reputation.level,
        positiveEvents: reputation.positiveEvents,
        negativeEvents: reputation.negativeEvents,
        lastActivityAt: reputation.lastActivityAt,
        updatedAt: new Date(),
      })
      .where(eq(reputationsTable.userId, reputation.userId))
      .returning();
    return toReputationModel(rows[0]!);
  }

  async addPoints(userId: string, points: number): Promise<Reputation> {
    const existing = await this.getByUserId(userId);
    if (!existing) throw new Error(`Reputation not found for user: ${userId}`);
    const newScore = existing.score + points;
    return this.update({
      ...existing,
      score: newScore,
      level: calculateLevel(newScore),
      positiveEvents: existing.positiveEvents + 1,
      lastActivityAt: new Date(),
    });
  }

  async subtractPoints(userId: string, points: number): Promise<Reputation> {
    const existing = await this.getByUserId(userId);
    if (!existing) throw new Error(`Reputation not found for user: ${userId}`);
    const newScore = existing.score - points;
    return this.update({
      ...existing,
      score: newScore,
      level: calculateLevel(newScore),
      negativeEvents: existing.negativeEvents + 1,
      lastActivityAt: new Date(),
    });
  }

  async saveEvent(event: Omit<ReputationEvent, "id" | "createdAt">): Promise<ReputationEvent> {
    const rows = await db
      .insert(reputationEventsTable)
      .values({
        userId: event.userId,
        sourceApp: event.sourceApp,
        reason: event.reason,
        points: event.points,
      })
      .returning();
    return toEventModel(rows[0]!);
  }

  async getEvents(userId: string): Promise<ReputationEvent[]> {
    const rows = await db
      .select()
      .from(reputationEventsTable)
      .where(eq(reputationEventsTable.userId, userId))
      .orderBy(desc(reputationEventsTable.createdAt));
    return rows.map(toEventModel);
  }

  async getLeaderboard(limit: number): Promise<Reputation[]> {
    const rows = await db
      .select()
      .from(reputationsTable)
      .orderBy(desc(reputationsTable.score))
      .limit(limit);
    return rows.map(toReputationModel);
  }
}

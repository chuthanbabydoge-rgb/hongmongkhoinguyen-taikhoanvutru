import { randomUUID } from "node:crypto";
import type { Reputation, ReputationEvent } from "../models/reputation";
import { calculateLevel } from "../models/reputation";
import type { IReputationRepository } from "./IReputationRepository";

export class InMemoryReputationRepository implements IReputationRepository {
  private reputations: Map<string, Reputation> = new Map(); // userId → Reputation
  private events: ReputationEvent[] = [];

  async getByUserId(userId: string): Promise<Reputation | null> {
    return this.reputations.get(userId) ?? null;
  }

  async create(userId: string): Promise<Reputation> {
    const now = new Date();
    const record: Reputation = {
      id: randomUUID(),
      userId,
      score: 0,
      level: "CITIZEN",
      positiveEvents: 0,
      negativeEvents: 0,
      lastActivityAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.reputations.set(userId, record);
    return record;
  }

  async update(reputation: Reputation): Promise<Reputation> {
    const updated: Reputation = { ...reputation, updatedAt: new Date() };
    this.reputations.set(reputation.userId, updated);
    return updated;
  }

  async addPoints(userId: string, points: number): Promise<Reputation> {
    const existing = this.reputations.get(userId);
    if (!existing) throw new Error(`Reputation not found for user: ${userId}`);
    const newScore = existing.score + points;
    const updated: Reputation = {
      ...existing,
      score: newScore,
      level: calculateLevel(newScore),
      positiveEvents: existing.positiveEvents + 1,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };
    this.reputations.set(userId, updated);
    return updated;
  }

  async subtractPoints(userId: string, points: number): Promise<Reputation> {
    const existing = this.reputations.get(userId);
    if (!existing) throw new Error(`Reputation not found for user: ${userId}`);
    const newScore = existing.score - points;
    const updated: Reputation = {
      ...existing,
      score: newScore,
      level: calculateLevel(newScore),
      negativeEvents: existing.negativeEvents + 1,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };
    this.reputations.set(userId, updated);
    return updated;
  }

  async saveEvent(event: Omit<ReputationEvent, "id" | "createdAt">): Promise<ReputationEvent> {
    const record: ReputationEvent = {
      id: randomUUID(),
      ...event,
      createdAt: new Date(),
    };
    this.events.push(record);
    return record;
  }

  async getEvents(userId: string): Promise<ReputationEvent[]> {
    return this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getLeaderboard(limit: number): Promise<Reputation[]> {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  clear(): void {
    this.reputations.clear();
    this.events = [];
  }
}

import type { Reputation, ReputationEvent } from "../models/reputation";

export interface IReputationRepository {
  getByUserId(userId: string): Promise<Reputation | null>;
  create(userId: string): Promise<Reputation>;
  update(reputation: Reputation): Promise<Reputation>;
  addPoints(userId: string, points: number): Promise<Reputation>;
  subtractPoints(userId: string, points: number): Promise<Reputation>;
  saveEvent(event: Omit<ReputationEvent, "id" | "createdAt">): Promise<ReputationEvent>;
  getEvents(userId: string): Promise<ReputationEvent[]>;
  getLeaderboard(limit: number): Promise<Reputation[]>;
}

import { randomUUID } from "node:crypto";
import type { Activity, CreateActivityRequest } from "../models/activity";
import { ActivityVisibility } from "../models/activity";
import type { IActivityRepository } from "./IActivityRepository";

export class InMemoryActivityRepository implements IActivityRepository {
  private store: Map<string, Activity> = new Map();

  async create(input: CreateActivityRequest): Promise<Activity> {
    const record: Activity = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type as Activity["type"],
      sourceApp: input.sourceApp,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? null,
      visibility: (input.visibility ?? ActivityVisibility.PUBLIC) as Activity["visibility"],
      createdAt: new Date(),
    };
    this.store.set(record.id, record);
    return record;
  }

  async getById(id: string): Promise<Activity | null> {
    return this.store.get(id) ?? null;
  }

  async getByUserId(userId: string, limit?: number, offset = 0): Promise<Activity[]> {
    let results = Array.from(this.store.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    results = results.slice(offset, limit !== undefined ? offset + limit : undefined);
    return results;
  }

  async getFeed(limit: number, offset: number): Promise<Activity[]> {
    return Array.from(this.store.values())
      .filter((a) => a.visibility === ActivityVisibility.PUBLIC)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(offset, offset + limit);
  }

  async delete(id: string): Promise<boolean> {
    if (!this.store.has(id)) return false;
    this.store.delete(id);
    return true;
  }

  async countByUserId(userId: string): Promise<number> {
    let count = 0;
    for (const a of this.store.values()) {
      if (a.userId === userId) count++;
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }
}

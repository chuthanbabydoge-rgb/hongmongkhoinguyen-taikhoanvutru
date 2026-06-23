import type { Activity, CreateActivityRequest } from "../models/activity";

export interface IActivityRepository {
  create(input: CreateActivityRequest): Promise<Activity>;
  getById(id: string): Promise<Activity | null>;
  getByUserId(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
  getFeed(limit: number, offset: number): Promise<Activity[]>;
  delete(id: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}

import type { IActivityRepository } from "../repositories/IActivityRepository";
import type { Activity, CreateActivityRequest, ActivityFilter } from "../models/activity";
import { CreateActivityRequestSchema } from "../models/activity";
import { ZodError } from "zod";

export class ActivityNotFoundError extends Error {
  constructor(id: string) {
    super(`Activity not found: ${id}`);
    this.name = "ActivityNotFoundError";
  }
}

export class ActivityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityValidationError";
  }
}

export class ActivityService {
  constructor(private readonly repo: IActivityRepository) {}

  /**
   * Create a new activity entry.
   * Validates input with Zod. Visibility defaults to PUBLIC.
   */
  async createActivity(raw: unknown): Promise<Activity> {
    let input: CreateActivityRequest;
    try {
      input = CreateActivityRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ActivityValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }
    return this.repo.create(input);
  }

  /** Activities for the authenticated user, newest first. */
  async getMyActivities(userId: string, filter?: ActivityFilter): Promise<Activity[]> {
    return this.repo.getByUserId(userId, filter?.limit, filter?.offset);
  }

  /** Activities for any user (public profile timeline). */
  async getActivitiesByUserId(userId: string, filter?: ActivityFilter): Promise<Activity[]> {
    return this.repo.getByUserId(userId, filter?.limit, filter?.offset);
  }

  /**
   * Global public activity feed across all users, newest first.
   * Only PUBLIC visibility activities are included.
   */
  async getFeed(limit = 20, offset = 0): Promise<Activity[]> {
    return this.repo.getFeed(limit, offset);
  }

  /** Total activity count for a user. */
  async countActivities(userId: string): Promise<number> {
    return this.repo.countByUserId(userId);
  }

  /**
   * Delete an activity by id.
   * Throws ActivityNotFoundError if not found.
   */
  async deleteActivity(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new ActivityNotFoundError(id);
  }

  /**
   * Internal helper — used by other services to record activities silently.
   * Does NOT throw if saving fails (fire-and-forget pattern).
   */
  async record(input: {
    userId: string;
    type: string;
    sourceApp: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.repo.create({
        userId: input.userId,
        type: input.type as CreateActivityRequest["type"],
        sourceApp: input.sourceApp,
        title: input.title,
        description: input.description,
        metadata: input.metadata,
        visibility: "PUBLIC",
      });
    } catch {
      // Fire-and-forget: never let activity recording break the calling service
    }
  }
}

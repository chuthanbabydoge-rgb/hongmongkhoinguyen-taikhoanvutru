import type { IAchievementRepository } from "../repositories/IAchievementRepository";
import type { Achievement, UserAchievement, GrantAchievementRequest } from "../models/achievement";
import { GrantAchievementRequestSchema } from "../models/achievement";
import type { ActivityService } from "./ActivityService";
import { ZodError } from "zod";

export class AchievementNotFoundError extends Error {
  constructor(key: string) {
    super(`Achievement not found: ${key}`);
    this.name = "AchievementNotFoundError";
  }
}

export class AchievementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AchievementValidationError";
  }
}

export class AchievementService {
  private initialized = false;

  constructor(
    private readonly repo: IAchievementRepository,
    private readonly activityService?: ActivityService,
  ) {}

  /**
   * Seed default achievements. Idempotent — safe to call multiple times.
   * Called once at server startup via container.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.repo.seedDefaults();
    this.initialized = true;
  }

  /** Return all achievement definitions. */
  async getAll(): Promise<Achievement[]> {
    return this.repo.getAll();
  }

  /**
   * Grant an achievement to a user by achievement ID.
   * Returns { achievement, created } — created=false on duplicate (idempotent).
   * Throws AchievementNotFoundError if the achievementId is unknown.
   */
  async grantAchievement(
    input: GrantAchievementRequest & { achievementId: string },
  ): Promise<{ achievement: UserAchievement; created: boolean }> {
    const { record, created } = await this.repo.grant(input);
    return { achievement: record, created };
  }

  /**
   * Grant an achievement to a user by its string key (e.g. "FIRST_LOGIN").
   * Validates input with Zod.
   * Throws AchievementNotFoundError if the key is unknown.
   * Auto-creates an Activity entry for the grant.
   */
  async grantAchievementByKey(
    raw: unknown,
  ): Promise<{ achievement: UserAchievement; created: boolean }> {
    let input: GrantAchievementRequest;
    try {
      input = GrantAchievementRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AchievementValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const achievement = await this.repo.findByKey(input.key);
    if (!achievement) throw new AchievementNotFoundError(input.key);

    const result = await this.grantAchievement({ ...input, achievementId: achievement.id });

    if (result.created && this.activityService) {
      await this.activityService.record({
        userId: input.userId,
        type: "ACHIEVEMENT",
        sourceApp: input.grantedBy,
        title: achievement.name,
        description: achievement.description,
        metadata: { achievementKey: achievement.key, points: achievement.points },
      });
    }

    return result;
  }

  /** Check if a user already has an achievement by key. */
  async hasAchievement(userId: string, key: string): Promise<boolean> {
    return this.repo.hasAchievement(userId, key);
  }

  /** Return all achievements earned by a user, newest first. */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.repo.getUserAchievements(userId);
  }

  /** Total number of achievements earned by a user. */
  async count(userId: string): Promise<number> {
    return this.repo.countUserAchievements(userId);
  }
}

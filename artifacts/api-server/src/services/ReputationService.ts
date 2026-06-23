import type { IReputationRepository } from "../repositories/IReputationRepository";
import type { NotificationService } from "./NotificationService";
import type { Reputation, ReputationEvent, LeaderboardEntry } from "../models/reputation";
import { calculateLevel, getBadgeForLevel, CreateReputationEventRequestSchema } from "../models/reputation";
import { ZodError } from "zod";

export class ReputationNotFoundError extends Error {
  constructor(userId: string) {
    super(`Reputation not found for user: ${userId}`);
    this.name = "ReputationNotFoundError";
  }
}

export class ReputationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReputationValidationError";
  }
}

export class ReputationService {
  constructor(
    private readonly repo: IReputationRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /** Get or auto-create reputation for the authenticated user. */
  async getMyReputation(userId: string): Promise<Reputation> {
    return this.getOrCreate(userId);
  }

  /** Get or auto-create reputation for any userId. */
  async getReputation(userId: string): Promise<Reputation> {
    return this.getOrCreate(userId);
  }

  /**
   * Add reputation points to a user.
   * Validates input with Zod.
   * Auto-creates reputation if it doesn't exist.
   * Fires level-up notification when level changes.
   * Returns updated Reputation.
   */
  async addReputation(
    userId: string,
    points: number,
    sourceApp: string,
    reason: string,
  ): Promise<Reputation> {
    this.validateEvent({ userId, points, sourceApp, reason });

    const before = await this.getOrCreate(userId);
    const after = await this.repo.addPoints(userId, points);

    await this.repo.saveEvent({ userId, sourceApp, reason, points });
    await this.maybeSendLevelUpNotification(userId, before.level, after.level);

    return after;
  }

  /**
   * Deduct reputation points from a user.
   * Validates input with Zod.
   * Auto-creates reputation if it doesn't exist.
   * Returns updated Reputation.
   */
  async deductReputation(
    userId: string,
    points: number,
    sourceApp: string,
    reason: string,
  ): Promise<Reputation> {
    this.validateEvent({ userId, points, sourceApp, reason });

    const before = await this.getOrCreate(userId);
    const after = await this.repo.subtractPoints(userId, points);

    await this.repo.saveEvent({ userId, sourceApp, reason, points: -points });
    await this.maybeSendLevelUpNotification(userId, before.level, after.level);

    return after;
  }

  /** Get reputation event history for a user, newest first. */
  async getHistory(userId: string): Promise<ReputationEvent[]> {
    return this.repo.getEvents(userId);
  }

  /** Top-N users by score. Defaults to top 10. */
  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const top = await this.repo.getLeaderboard(limit);
    return top.map((r) => ({
      userId: r.userId,
      score: r.score,
      level: r.level,
      badge: getBadgeForLevel(r.level),
    }));
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async getOrCreate(userId: string): Promise<Reputation> {
    const existing = await this.repo.getByUserId(userId);
    if (existing) return existing;
    return this.repo.create(userId);
  }

  private validateEvent(raw: unknown): void {
    try {
      CreateReputationEventRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ReputationValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }
  }

  private async maybeSendLevelUpNotification(
    userId: string,
    oldLevel: string,
    newLevel: string,
  ): Promise<void> {
    if (oldLevel === newLevel) return;

    // Only notify on upgrades (CITIZEN < TRUSTED < ELITE < LEGEND < MYTHIC)
    const order = ["CITIZEN", "TRUSTED", "ELITE", "LEGEND", "MYTHIC"];
    const oldIdx = order.indexOf(oldLevel);
    const newIdx = order.indexOf(newLevel);
    if (newIdx <= oldIdx) return;

    const badge = getBadgeForLevel(newLevel as Parameters<typeof getBadgeForLevel>[0]);

    await this.notificationService.send({
      userId,
      type: "ACCOUNT",
      title: "🎉 Thăng cấp danh tiếng",
      message: `Bạn đã đạt cấp độ ${badge} ${newLevel}.`,
      sourceApp: "universe-account",
      priority: "HIGH",
    });
  }
}

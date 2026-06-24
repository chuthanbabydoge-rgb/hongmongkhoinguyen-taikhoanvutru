import { ZodError } from "zod";
import type { IUserSettingsRepository } from "../repositories/IUserSettingsRepository";
import type { UserSettings, UpdateUserSettingsRequest, ViewerRelation, NotificationSettingType } from "../models/userSettings";
import { UpdateUserSettingsSchema, DEFAULT_SETTINGS } from "../models/userSettings";
import type { ActivityService } from "./ActivityService";
import type { NotificationService } from "./NotificationService";

// ─── Errors ───────────────────────────────────────────────────────────────────

export class SettingsNotFoundError extends Error {
  constructor(userId: string) {
    super(`Settings not found for user: ${userId}`);
    this.name = "SettingsNotFoundError";
  }
}

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class UserSettingsService {
  constructor(
    private readonly repo: IUserSettingsRepository,
    private readonly activityService?: ActivityService,
    private readonly notificationService?: NotificationService,
  ) {}

  /**
   * Get settings for a user. Auto-creates with defaults if none exist.
   */
  async getMySettings(userId: string): Promise<UserSettings> {
    const existing = await this.repo.findByUserId(userId);
    if (existing) return existing;
    return this.repo.create({ userId });
  }

  /**
   * Partial update. Validates input. Records activity. Sends notifications for privacy/security changes.
   */
  async updateMySettings(userId: string, raw: unknown): Promise<UserSettings> {
    let input: UpdateUserSettingsRequest;
    try {
      input = UpdateUserSettingsSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new SettingsValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const settings = await this.repo.upsert(userId, input);

    await this.activityService?.record({
      userId,
      type: "ACCOUNT",
      sourceApp: "universe-account",
      title: "Settings Updated",
    });

    const privacyKeys = ["privacyProfile", "privacyActivity", "privacyReputation"] as const;
    const privacyChanged = privacyKeys.some((k) => k in input);
    if (privacyChanged && this.notificationService) {
      await this.notificationService.send({
        userId,
        type: "ACCOUNT",
        title: "Privacy Settings Updated",
        message: "Your privacy settings have been changed.",
        sourceApp: "universe-account",
        priority: "NORMAL",
      }).catch(() => {});
    }

    if (input.securityNotifications === false && this.notificationService) {
      await this.notificationService.send({
        userId,
        type: "SECURITY",
        title: "Security Notifications Disabled",
        message: "You have turned off security notifications. Re-enable them to stay protected.",
        sourceApp: "universe-account",
        priority: "HIGH",
      }).catch(() => {});
    }

    return settings;
  }

  /**
   * Reset all settings to defaults. Records activity.
   */
  async resetSettings(userId: string): Promise<UserSettings> {
    const settings = await this.repo.upsert(userId, DEFAULT_SETTINGS);

    await this.activityService?.record({
      userId,
      type: "ACCOUNT",
      sourceApp: "universe-account",
      title: "Settings Reset",
    });

    return settings;
  }

  /**
   * Privacy resolver — can viewerRelation view the owner's profile?
   * Rules:
   *   PUBLIC   → anyone
   *   FRIENDS  → owner or friend
   *   PRIVATE  → owner only
   */
  canViewProfile(
    ownerSettings: UserSettings,
    viewerRelation: ViewerRelation,
  ): boolean {
    const privacy = ownerSettings.privacyProfile;
    if (privacy === "PUBLIC") return true;
    if (privacy === "FRIENDS") return viewerRelation === "OWNER" || viewerRelation === "FRIEND";
    return viewerRelation === "OWNER";
  }

  /**
   * Notification preference resolver — should we send this notification type?
   */
  shouldSendNotification(
    settings: UserSettings,
    notificationType: NotificationSettingType,
  ): boolean {
    switch (notificationType) {
      case "ACHIEVEMENT":  return settings.achievementNotifications;
      case "REPUTATION":   return settings.reputationNotifications;
      case "MARKETPLACE":  return settings.marketplaceNotifications;
      case "SECURITY":     return settings.securityNotifications;
      case "SYSTEM":       return settings.pushNotifications;
      default:             return true;
    }
  }
}

import { randomUUID } from "node:crypto";
import type { UserSettings, UpdateUserSettingsRequest } from "../models/userSettings";
import { DEFAULT_SETTINGS } from "../models/userSettings";
import type { CreateUserSettingsInput, IUserSettingsRepository } from "./IUserSettingsRepository";

export class InMemoryUserSettingsRepository implements IUserSettingsRepository {
  private store: Map<string, UserSettings> = new Map();

  async create(input: CreateUserSettingsInput): Promise<UserSettings> {
    const now = new Date();
    const settings: UserSettings = {
      id: randomUUID(),
      userId: input.userId,
      theme: (input.theme as UserSettings["theme"]) ?? DEFAULT_SETTINGS.theme,
      language: (input.language as UserSettings["language"]) ?? DEFAULT_SETTINGS.language,
      timezone: input.timezone ?? DEFAULT_SETTINGS.timezone,
      privacyProfile: (input.privacyProfile as UserSettings["privacyProfile"]) ?? DEFAULT_SETTINGS.privacyProfile,
      privacyActivity: (input.privacyActivity as UserSettings["privacyActivity"]) ?? DEFAULT_SETTINGS.privacyActivity,
      privacyReputation: (input.privacyReputation as UserSettings["privacyReputation"]) ?? DEFAULT_SETTINGS.privacyReputation,
      emailNotifications: input.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
      pushNotifications: input.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications,
      marketplaceNotifications: input.marketplaceNotifications ?? DEFAULT_SETTINGS.marketplaceNotifications,
      achievementNotifications: input.achievementNotifications ?? DEFAULT_SETTINGS.achievementNotifications,
      reputationNotifications: input.reputationNotifications ?? DEFAULT_SETTINGS.reputationNotifications,
      securityNotifications: input.securityNotifications ?? DEFAULT_SETTINGS.securityNotifications,
      allowFriendRequests: input.allowFriendRequests ?? DEFAULT_SETTINGS.allowFriendRequests,
      allowDirectMessages: input.allowDirectMessages ?? DEFAULT_SETTINGS.allowDirectMessages,
      showOnlineStatus: input.showOnlineStatus ?? DEFAULT_SETTINGS.showOnlineStatus,
      showLastSeen: input.showLastSeen ?? DEFAULT_SETTINGS.showLastSeen,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(input.userId, settings);
    return settings;
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.store.get(userId) ?? null;
  }

  async update(userId: string, input: UpdateUserSettingsRequest): Promise<UserSettings | null> {
    const existing = this.store.get(userId);
    if (!existing) return null;
    const updated: UserSettings = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };
    this.store.set(userId, updated);
    return updated;
  }

  async delete(userId: string): Promise<boolean> {
    return this.store.delete(userId);
  }

  async exists(userId: string): Promise<boolean> {
    return this.store.has(userId);
  }

  async upsert(userId: string, input?: UpdateUserSettingsRequest): Promise<UserSettings> {
    const existing = this.store.get(userId);
    if (!existing) {
      return this.create({ userId, ...input });
    }
    if (input) {
      return (await this.update(userId, input))!;
    }
    return existing;
  }

  clear(): void {
    this.store.clear();
  }
}

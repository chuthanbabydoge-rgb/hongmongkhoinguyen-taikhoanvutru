import { eq } from "drizzle-orm";
import type { UserSettings, UpdateUserSettingsRequest } from "../models/userSettings";
import { DEFAULT_SETTINGS } from "../models/userSettings";
import type { CreateUserSettingsInput, IUserSettingsRepository } from "./IUserSettingsRepository";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db/schema";

function toModel(row: typeof userSettingsTable.$inferSelect): UserSettings {
  return {
    id: row.id,
    userId: row.userId,
    theme: row.theme as UserSettings["theme"],
    language: row.language as UserSettings["language"],
    timezone: row.timezone,
    privacyProfile: row.privacyProfile as UserSettings["privacyProfile"],
    privacyActivity: row.privacyActivity as UserSettings["privacyActivity"],
    privacyReputation: row.privacyReputation as UserSettings["privacyReputation"],
    emailNotifications: row.emailNotifications,
    pushNotifications: row.pushNotifications,
    marketplaceNotifications: row.marketplaceNotifications,
    achievementNotifications: row.achievementNotifications,
    reputationNotifications: row.reputationNotifications,
    securityNotifications: row.securityNotifications,
    allowFriendRequests: row.allowFriendRequests,
    allowDirectMessages: row.allowDirectMessages,
    showOnlineStatus: row.showOnlineStatus,
    showLastSeen: row.showLastSeen,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SupabaseUserSettingsRepository implements IUserSettingsRepository {
  async create(input: CreateUserSettingsInput): Promise<UserSettings> {
    const rows = await db
      .insert(userSettingsTable)
      .values({
        userId: input.userId,
        theme: input.theme ?? DEFAULT_SETTINGS.theme,
        language: input.language ?? DEFAULT_SETTINGS.language,
        timezone: input.timezone ?? DEFAULT_SETTINGS.timezone,
        privacyProfile: input.privacyProfile ?? DEFAULT_SETTINGS.privacyProfile,
        privacyActivity: input.privacyActivity ?? DEFAULT_SETTINGS.privacyActivity,
        privacyReputation: input.privacyReputation ?? DEFAULT_SETTINGS.privacyReputation,
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
      })
      .returning();
    return toModel(rows[0]!);
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const rows = await db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async update(userId: string, input: UpdateUserSettingsRequest): Promise<UserSettings | null> {
    const rows = await db
      .update(userSettingsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async delete(userId: string): Promise<boolean> {
    const rows = await db
      .delete(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .returning();
    return rows.length > 0;
  }

  async exists(userId: string): Promise<boolean> {
    const rows = await db
      .select({ id: userSettingsTable.id })
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);
    return rows.length > 0;
  }

  async upsert(userId: string, input?: UpdateUserSettingsRequest): Promise<UserSettings> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return this.create({ userId, ...input });
    }
    if (input) {
      return (await this.update(userId, input))!;
    }
    return existing;
  }
}

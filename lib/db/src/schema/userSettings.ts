import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull(),

  theme: text("theme").notNull().default("SYSTEM"),

  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),

  privacyProfile: text("privacy_profile").notNull().default("PUBLIC"),
  privacyActivity: text("privacy_activity").notNull().default("PUBLIC"),
  privacyReputation: text("privacy_reputation").notNull().default("PUBLIC"),

  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  marketplaceNotifications: boolean("marketplace_notifications").notNull().default(true),
  achievementNotifications: boolean("achievement_notifications").notNull().default(true),
  reputationNotifications: boolean("reputation_notifications").notNull().default(true),
  securityNotifications: boolean("security_notifications").notNull().default(true),

  allowFriendRequests: boolean("allow_friend_requests").notNull().default(true),
  allowDirectMessages: boolean("allow_direct_messages").notNull().default(true),
  showOnlineStatus: boolean("show_online_status").notNull().default(true),
  showLastSeen: boolean("show_last_seen").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSettingsSchema = createSelectSchema(userSettingsTable);

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettingsRow = typeof userSettingsTable.$inferSelect;

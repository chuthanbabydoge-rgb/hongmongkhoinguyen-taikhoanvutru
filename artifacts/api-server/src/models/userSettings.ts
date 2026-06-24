import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const Theme = {
  LIGHT: "LIGHT",
  DARK: "DARK",
  SYSTEM: "SYSTEM",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const Language = {
  en: "en",
  vi: "vi",
  ja: "ja",
  ko: "ko",
  zh: "zh",
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const Privacy = {
  PUBLIC: "PUBLIC",
  FRIENDS: "FRIENDS",
  PRIVATE: "PRIVATE",
} as const;
export type Privacy = (typeof Privacy)[keyof typeof Privacy];

export const ViewerRelation = {
  OWNER: "OWNER",
  FRIEND: "FRIEND",
  PUBLIC: "PUBLIC",
} as const;
export type ViewerRelation = (typeof ViewerRelation)[keyof typeof ViewerRelation];

export const NotificationSettingType = {
  ACHIEVEMENT: "ACHIEVEMENT",
  REPUTATION: "REPUTATION",
  MARKETPLACE: "MARKETPLACE",
  SECURITY: "SECURITY",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationSettingType =
  (typeof NotificationSettingType)[keyof typeof NotificationSettingType];

// ─── Core model ───────────────────────────────────────────────────────────────

export const UserSettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  language: z.enum(["en", "vi", "ja", "ko", "zh"]),
  timezone: z.string(),
  privacyProfile: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]),
  privacyActivity: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]),
  privacyReputation: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  marketplaceNotifications: z.boolean(),
  achievementNotifications: z.boolean(),
  reputationNotifications: z.boolean(),
  securityNotifications: z.boolean(),
  allowFriendRequests: z.boolean(),
  allowDirectMessages: z.boolean(),
  showOnlineStatus: z.boolean(),
  showLastSeen: z.boolean(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// ─── Update schema (partial) ──────────────────────────────────────────────────

export const UpdateUserSettingsSchema = z
  .object({
    theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
    language: z.enum(["en", "vi", "ja", "ko", "zh"]).optional(),
    timezone: z.string().min(1).max(100).optional(),
    privacyProfile: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
    privacyActivity: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
    privacyReputation: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    marketplaceNotifications: z.boolean().optional(),
    achievementNotifications: z.boolean().optional(),
    reputationNotifications: z.boolean().optional(),
    securityNotifications: z.boolean().optional(),
    allowFriendRequests: z.boolean().optional(),
    allowDirectMessages: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    showLastSeen: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsSchema>;

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Omit<
  UserSettings,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  theme: "SYSTEM",
  language: "en",
  timezone: "UTC",
  privacyProfile: "PUBLIC",
  privacyActivity: "PUBLIC",
  privacyReputation: "PUBLIC",
  emailNotifications: true,
  pushNotifications: true,
  marketplaceNotifications: true,
  achievementNotifications: true,
  reputationNotifications: true,
  securityNotifications: true,
  allowFriendRequests: true,
  allowDirectMessages: true,
  showOnlineStatus: true,
  showLastSeen: true,
};

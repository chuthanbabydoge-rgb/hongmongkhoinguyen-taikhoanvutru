import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const NotificationType = {
  SYSTEM: "SYSTEM",
  ACCOUNT: "ACCOUNT",
  MARKETPLACE: "MARKETPLACE",
  SPORT: "SPORT",
  WORLD: "WORLD",
  ANIMAL: "ANIMAL",
  BUSINESS: "BUSINESS",
  SECURITY: "SECURITY",
  SOCIAL: "SOCIAL",
  ACHIEVEMENT: "ACHIEVEMENT",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationStatus = {
  UNREAD: "UNREAD",
  READ: "READ",
  ARCHIVED: "ARCHIVED",
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// ─── Core model ───────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string | null;
  sourceApp: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date | null;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const typeValues = Object.values(NotificationType) as [string, ...string[]];
const priorityValues = Object.values(NotificationPriority) as [string, ...string[]];

export const CreateNotificationRequestSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.enum(typeValues, { invalid_type_error: "Invalid notification type" }),
  title: z.string().min(1, "title is required").max(200, "title too long"),
  message: z.string().min(1, "message is required").max(1000, "message too long"),
  icon: z.string().optional(),
  sourceApp: z.string().min(1, "sourceApp is required"),
  priority: z.enum(priorityValues as [string, ...string[]]).optional().default("NORMAL"),
  actionUrl: z.string().url("actionUrl must be a valid URL").optional().or(z.literal("")).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>;

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
  sort?: "asc" | "desc";
}

export interface NotificationCount {
  unread: number;
}

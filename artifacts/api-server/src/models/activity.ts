import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ActivityType = {
  ACCOUNT:      "ACCOUNT",
  ACHIEVEMENT:  "ACHIEVEMENT",
  REPUTATION:   "REPUTATION",
  NOTIFICATION: "NOTIFICATION",
  SPORT:        "SPORT",
  ANIMAL:       "ANIMAL",
  WORLD:        "WORLD",
  MARKETPLACE:  "MARKETPLACE",
  SAFEPASS:     "SAFEPASS",
  EXCHANGE:     "EXCHANGE",
  SYSTEM:       "SYSTEM",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityVisibility = {
  PUBLIC:  "PUBLIC",
  FRIENDS: "FRIENDS",
  PRIVATE: "PRIVATE",
} as const;
export type ActivityVisibility = (typeof ActivityVisibility)[keyof typeof ActivityVisibility];

// ─── Core model ───────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  sourceApp: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  visibility: ActivityVisibility;
  createdAt: Date | null;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const typeValues = Object.values(ActivityType) as [string, ...string[]];
const visibilityValues = Object.values(ActivityVisibility) as [string, ...string[]];

export const CreateActivityRequestSchema = z.object({
  userId:      z.string().min(1, "userId is required"),
  type:        z.enum(typeValues, { invalid_type_error: "Invalid activity type" }),
  sourceApp:   z.string().min(1, "sourceApp is required"),
  title:       z.string().min(1, "title is required").max(200, "title too long"),
  description: z.string().max(1000, "description too long").optional(),
  metadata:    z.record(z.unknown()).optional(),
  visibility:  z.enum(visibilityValues as [string, ...string[]]).optional().default("PUBLIC"),
});

export type CreateActivityRequest = z.infer<typeof CreateActivityRequestSchema>;

export interface ActivityFilter {
  type?: ActivityType;
  visibility?: ActivityVisibility;
  limit?: number;
  offset?: number;
}

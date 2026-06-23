import { z } from "zod";

// ─── Level system ──────────────────────────────────────────────────────────────

export const ReputationLevel = {
  CITIZEN: "CITIZEN",   // 0–99
  TRUSTED: "TRUSTED",   // 100–499
  ELITE: "ELITE",       // 500–999
  LEGEND: "LEGEND",     // 1000–4999
  MYTHIC: "MYTHIC",     // 5000+
} as const;
export type ReputationLevel = (typeof ReputationLevel)[keyof typeof ReputationLevel];

export function calculateLevel(score: number): ReputationLevel {
  if (score >= 5000) return ReputationLevel.MYTHIC;
  if (score >= 1000) return ReputationLevel.LEGEND;
  if (score >= 500)  return ReputationLevel.ELITE;
  if (score >= 100)  return ReputationLevel.TRUSTED;
  return ReputationLevel.CITIZEN;
}

export function getBadgeForLevel(level: ReputationLevel): string {
  switch (level) {
    case ReputationLevel.CITIZEN: return "🟢";
    case ReputationLevel.TRUSTED: return "🔵";
    case ReputationLevel.ELITE:   return "🟣";
    case ReputationLevel.LEGEND:  return "🟠";
    case ReputationLevel.MYTHIC:  return "🔴";
  }
}

// ─── Core models ───────────────────────────────────────────────────────────────

export interface Reputation {
  id: string;
  userId: string;
  score: number;
  level: ReputationLevel;
  positiveEvents: number;
  negativeEvents: number;
  lastActivityAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ReputationEvent {
  id: string;
  userId: string;
  sourceApp: string;
  reason: string;
  points: number;
  createdAt: Date | null;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  level: ReputationLevel;
  badge: string;
}

// ─── Zod schemas ───────────────────────────────────────────────────────────────

export const CreateReputationEventRequestSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  points: z
    .number({ invalid_type_error: "points must be a number" })
    .int("points must be an integer")
    .positive("points must be positive"),
  sourceApp: z.string().min(1, "sourceApp is required"),
  reason: z.string().min(1, "reason is required"),
});

export type CreateReputationEventRequest = z.infer<typeof CreateReputationEventRequestSchema>;

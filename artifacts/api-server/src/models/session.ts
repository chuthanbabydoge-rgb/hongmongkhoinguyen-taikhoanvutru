import { z } from "zod";

// ─── Core models ───────────────────────────────────────────────────────────────

export interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  lastSeenAt: Date | null;
  createdAt: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  applicationId: string;
  deviceId: string;
  accessTokenId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  lastSeenAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date | null;
}

export interface DeviceSummary {
  id: string;
  deviceName: string | null;
  platform: string | null;
  browser: string | null;
  lastSeenAt: Date | null;
}

export interface SessionSummary {
  id: string;
  applicationId: string;
  deviceId: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  expiresAt: Date | null;
}

export interface LogoutAllResponse {
  revoked: number;
}

// ─── Zod schemas ───────────────────────────────────────────────────────────────

export const CreateDeviceRequestSchema = z.object({
  userId:      z.string().min(1, "userId is required"),
  fingerprint: z.string().min(1, "fingerprint is required"),
  deviceName:  z.string().optional(),
  platform:    z.string().optional(),
  browser:     z.string().optional(),
});
export type CreateDeviceRequest = z.infer<typeof CreateDeviceRequestSchema>;

export const CreateSessionRequestSchema = z.object({
  userId:        z.string().min(1, "userId is required"),
  applicationId: z.string().min(1, "applicationId is required"),
  fingerprint:   z.string().min(1, "fingerprint is required"),
  deviceName:    z.string().optional(),
  platform:      z.string().optional(),
  browser:       z.string().optional(),
  ipAddress:     z.string().optional(),
  userAgent:     z.string().optional(),
  expiresAt:     z.date().optional(),
  accessTokenId: z.string().optional(),
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

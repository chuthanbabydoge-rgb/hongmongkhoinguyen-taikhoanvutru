import type { Device, Session } from "../models/session";

export interface ISessionRepository {
  // ─── Device methods ──────────────────────────────────────────────────────────
  createDevice(device: Omit<Device, "id" | "createdAt" | "lastSeenAt">): Promise<Device>;
  findDeviceById(id: string): Promise<Device | null>;
  findDeviceByFingerprint(userId: string, fingerprint: string): Promise<Device | null>;
  findDevicesByUserId(userId: string): Promise<Device[]>;
  updateDevice(id: string, data: Partial<Pick<Device, "deviceName" | "platform" | "browser" | "lastSeenAt">>): Promise<Device | null>;
  deleteDevice(id: string): Promise<void>;

  // ─── Session methods ─────────────────────────────────────────────────────────
  createSession(session: Omit<Session, "id" | "createdAt" | "lastSeenAt" | "isActive">): Promise<Session>;
  findSessionById(id: string): Promise<Session | null>;
  findSessionsByUserId(userId: string): Promise<Session[]>;
  updateSession(id: string, data: Partial<Pick<Session, "isActive" | "lastSeenAt">>): Promise<Session | null>;
  revokeSession(id: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<number>;
  countActiveSessions(userId: string): Promise<number>;
}

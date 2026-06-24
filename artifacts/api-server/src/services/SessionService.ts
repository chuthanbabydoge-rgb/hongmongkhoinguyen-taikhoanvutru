import { ZodError } from "zod";
import type { ISessionRepository } from "../repositories/ISessionRepository";
import type { Device, Session, DeviceSummary, SessionSummary, LogoutAllResponse } from "../models/session";
import { CreateSessionRequestSchema } from "../models/session";

// ─── Error classes ─────────────────────────────────────────────────────────────

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
    this.name = "SessionNotFoundError";
  }
}

export class DeviceNotFoundError extends Error {
  constructor(id: string) {
    super(`Device not found: ${id}`);
    this.name = "DeviceNotFoundError";
  }
}

export class SessionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionValidationError";
  }
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class SessionService {
  constructor(private readonly repo: ISessionRepository) {}

  /**
   * Create a session for a user on an application.
   * Device fingerprint deduplication: same user + same fingerprint → reuse device (update lastSeenAt).
   */
  async createSession(input: {
    userId: string;
    applicationId: string;
    fingerprint: string;
    deviceName?: string;
    platform?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt?: Date;
    accessTokenId?: string;
  }): Promise<Session> {
    this.validate(CreateSessionRequestSchema, input);

    // Device deduplication — same user + fingerprint → reuse
    let device = await this.repo.findDeviceByFingerprint(input.userId, input.fingerprint);

    if (device) {
      device = (await this.repo.updateDevice(device.id, { lastSeenAt: new Date() })) ?? device;
    } else {
      device = await this.repo.createDevice({
        userId:      input.userId,
        fingerprint: input.fingerprint,
        deviceName:  input.deviceName ?? null,
        platform:    input.platform ?? null,
        browser:     input.browser ?? null,
      });
    }

    const session = await this.repo.createSession({
      userId:        input.userId,
      applicationId: input.applicationId,
      deviceId:      device.id,
      accessTokenId: input.accessTokenId ?? null,
      ipAddress:     input.ipAddress ?? null,
      userAgent:     input.userAgent ?? null,
      expiresAt:     input.expiresAt ?? null,
    });

    return session;
  }

  /**
   * Touch a session — update lastSeenAt timestamp.
   * Used on every successful token verify.
   */
  async touchSession(sessionId: string): Promise<void> {
    const session = await this.repo.findSessionById(sessionId);
    if (!session) return; // silent — token may not have an associated session
    await this.repo.updateSession(sessionId, { lastSeenAt: new Date() });
  }

  /**
   * Revoke a single session by ID.
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.repo.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);
    await this.repo.revokeSession(sessionId);
  }

  /**
   * Revoke a session by its SSO accessTokenId.
   * Used when revokeToken() is called in SSOService.
   * Silently no-ops if not found.
   */
  async revokeSessionByToken(userId: string, accessTokenId: string): Promise<void> {
    const sessions = await this.repo.findSessionsByUserId(userId);
    const target = sessions.find((s) => s.accessTokenId === accessTokenId && s.isActive);
    if (target) await this.repo.revokeSession(target.id);
  }

  /**
   * Logout all active sessions for a user.
   */
  async logoutAll(userId: string): Promise<LogoutAllResponse> {
    const revoked = await this.repo.revokeAllSessions(userId);
    return { revoked };
  }

  /**
   * Get active sessions for a user as summaries.
   */
  async getMySessions(userId: string): Promise<SessionSummary[]> {
    const sessions = await this.repo.findSessionsByUserId(userId);
    return sessions
      .filter((s) => s.isActive)
      .map((s) => ({
        id:            s.id,
        applicationId: s.applicationId,
        deviceId:      s.deviceId,
        isActive:      s.isActive,
        lastSeenAt:    s.lastSeenAt,
        expiresAt:     s.expiresAt,
      }));
  }

  /**
   * Get all devices for a user as summaries.
   */
  async getMyDevices(userId: string): Promise<DeviceSummary[]> {
    const devices = await this.repo.findDevicesByUserId(userId);
    return devices.map((d) => ({
      id:         d.id,
      deviceName: d.deviceName,
      platform:   d.platform,
      browser:    d.browser,
      lastSeenAt: d.lastSeenAt,
    }));
  }

  /**
   * Delete a device and revoke all its sessions.
   */
  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.repo.findDeviceById(deviceId);
    if (!device) throw new DeviceNotFoundError(deviceId);
    if (device.userId !== userId) throw new DeviceNotFoundError(deviceId);

    // Revoke all sessions tied to this device
    const sessions = await this.repo.findSessionsByUserId(userId);
    for (const s of sessions) {
      if (s.deviceId === deviceId && s.isActive) {
        await this.repo.revokeSession(s.id);
      }
    }

    await this.repo.deleteDevice(deviceId);
  }

  /**
   * Count active sessions for a user.
   */
  async countActiveSessions(userId: string): Promise<number> {
    return this.repo.countActiveSessions(userId);
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private validate(schema: { parse(v: unknown): unknown }, data: unknown): void {
    try {
      schema.parse(data);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new SessionValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }
  }
}

import { eq, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { devicesTable, sessionsTable } from "@workspace/db/schema";
import type { Device, Session } from "../models/session";
import type { ISessionRepository } from "./ISessionRepository";

function toDevice(row: typeof devicesTable.$inferSelect): Device {
  return {
    id:          row.id,
    userId:      row.userId,
    fingerprint: row.fingerprint,
    deviceName:  row.deviceName,
    platform:    row.platform,
    browser:     row.browser,
    lastSeenAt:  row.lastSeenAt,
    createdAt:   row.createdAt,
  };
}

function toSession(row: typeof sessionsTable.$inferSelect): Session {
  return {
    id:            row.id,
    userId:        row.userId,
    applicationId: row.applicationId,
    deviceId:      row.deviceId,
    accessTokenId: row.accessTokenId,
    ipAddress:     row.ipAddress,
    userAgent:     row.userAgent,
    isActive:      row.isActive,
    lastSeenAt:    row.lastSeenAt,
    expiresAt:     row.expiresAt,
    createdAt:     row.createdAt,
  };
}

export class SupabaseSessionRepository implements ISessionRepository {
  // ─── Device methods ──────────────────────────────────────────────────────────

  async createDevice(device: Omit<Device, "id" | "createdAt" | "lastSeenAt">): Promise<Device> {
    const rows = await db
      .insert(devicesTable)
      .values({
        userId:      device.userId,
        fingerprint: device.fingerprint,
        deviceName:  device.deviceName ?? null,
        platform:    device.platform ?? null,
        browser:     device.browser ?? null,
      })
      .returning();
    return toDevice(rows[0]!);
  }

  async findDeviceById(id: string): Promise<Device | null> {
    const rows = await db.select().from(devicesTable).where(eq(devicesTable.id, id)).limit(1);
    return rows[0] ? toDevice(rows[0]) : null;
  }

  async findDeviceByFingerprint(userId: string, fingerprint: string): Promise<Device | null> {
    const rows = await db
      .select()
      .from(devicesTable)
      .where(and(eq(devicesTable.userId, userId), eq(devicesTable.fingerprint, fingerprint)))
      .limit(1);
    return rows[0] ? toDevice(rows[0]) : null;
  }

  async findDevicesByUserId(userId: string): Promise<Device[]> {
    const rows = await db.select().from(devicesTable).where(eq(devicesTable.userId, userId));
    return rows.map(toDevice);
  }

  async updateDevice(
    id: string,
    data: Partial<Pick<Device, "deviceName" | "platform" | "browser" | "lastSeenAt">>,
  ): Promise<Device | null> {
    const rows = await db
      .update(devicesTable)
      .set({
        ...(data.deviceName !== undefined && { deviceName: data.deviceName }),
        ...(data.platform !== undefined && { platform: data.platform }),
        ...(data.browser !== undefined && { browser: data.browser }),
        ...(data.lastSeenAt !== undefined && { lastSeenAt: data.lastSeenAt }),
      })
      .where(eq(devicesTable.id, id))
      .returning();
    return rows[0] ? toDevice(rows[0]) : null;
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(devicesTable).where(eq(devicesTable.id, id));
  }

  // ─── Session methods ─────────────────────────────────────────────────────────

  async createSession(session: Omit<Session, "id" | "createdAt" | "lastSeenAt" | "isActive">): Promise<Session> {
    const rows = await db
      .insert(sessionsTable)
      .values({
        userId:        session.userId,
        applicationId: session.applicationId,
        deviceId:      session.deviceId,
        accessTokenId: session.accessTokenId ?? null,
        ipAddress:     session.ipAddress ?? null,
        userAgent:     session.userAgent ?? null,
        expiresAt:     session.expiresAt ?? null,
        isActive:      true,
      })
      .returning();
    return toSession(rows[0]!);
  }

  async findSessionById(id: string): Promise<Session | null> {
    const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    return rows[0] ? toSession(rows[0]) : null;
  }

  async findSessionsByUserId(userId: string): Promise<Session[]> {
    const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, userId));
    return rows.map(toSession);
  }

  async updateSession(
    id: string,
    data: Partial<Pick<Session, "isActive" | "lastSeenAt">>,
  ): Promise<Session | null> {
    const rows = await db
      .update(sessionsTable)
      .set({
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.lastSeenAt !== undefined && { lastSeenAt: data.lastSeenAt }),
      })
      .where(eq(sessionsTable.id, id))
      .returning();
    return rows[0] ? toSession(rows[0]) : null;
  }

  async revokeSession(id: string): Promise<void> {
    await db.update(sessionsTable).set({ isActive: false }).where(eq(sessionsTable.id, id));
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const result = await db
      .update(sessionsTable)
      .set({ isActive: false })
      .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.isActive, true)))
      .returning({ id: sessionsTable.id });
    return result.length;
  }

  async countActiveSessions(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessionsTable)
      .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.isActive, true)));
    return result[0]?.count ?? 0;
  }
}

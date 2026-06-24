import { randomUUID } from "node:crypto";
import type { Device, Session } from "../models/session";
import type { ISessionRepository } from "./ISessionRepository";

export class InMemorySessionRepository implements ISessionRepository {
  private devices: Map<string, Device> = new Map();
  private sessions: Map<string, Session> = new Map();

  // ─── Device methods ──────────────────────────────────────────────────────────

  async createDevice(device: Omit<Device, "id" | "createdAt" | "lastSeenAt">): Promise<Device> {
    const record: Device = {
      ...device,
      id: randomUUID(),
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };
    this.devices.set(record.id, record);
    return record;
  }

  async findDeviceById(id: string): Promise<Device | null> {
    return this.devices.get(id) ?? null;
  }

  async findDeviceByFingerprint(userId: string, fingerprint: string): Promise<Device | null> {
    for (const d of this.devices.values()) {
      if (d.userId === userId && d.fingerprint === fingerprint) return d;
    }
    return null;
  }

  async findDevicesByUserId(userId: string): Promise<Device[]> {
    return Array.from(this.devices.values())
      .filter((d) => d.userId === userId)
      .sort((a, b) => (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0));
  }

  async updateDevice(
    id: string,
    data: Partial<Pick<Device, "deviceName" | "platform" | "browser" | "lastSeenAt">>,
  ): Promise<Device | null> {
    const d = this.devices.get(id);
    if (!d) return null;
    const updated = { ...d, ...data };
    this.devices.set(id, updated);
    return updated;
  }

  async deleteDevice(id: string): Promise<void> {
    this.devices.delete(id);
  }

  // ─── Session methods ─────────────────────────────────────────────────────────

  async createSession(session: Omit<Session, "id" | "createdAt" | "lastSeenAt" | "isActive">): Promise<Session> {
    const record: Session = {
      ...session,
      id: randomUUID(),
      isActive: true,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };
    this.sessions.set(record.id, record);
    return record;
  }

  async findSessionById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async findSessionsByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0));
  }

  async updateSession(
    id: string,
    data: Partial<Pick<Session, "isActive" | "lastSeenAt">>,
  ): Promise<Session | null> {
    const s = this.sessions.get(id);
    if (!s) return null;
    const updated = { ...s, ...data };
    this.sessions.set(id, updated);
    return updated;
  }

  async revokeSession(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (s) this.sessions.set(id, { ...s, isActive: false });
  }

  async revokeAllSessions(userId: string): Promise<number> {
    let count = 0;
    for (const [id, s] of this.sessions.entries()) {
      if (s.userId === userId && s.isActive) {
        this.sessions.set(id, { ...s, isActive: false });
        count++;
      }
    }
    return count;
  }

  async countActiveSessions(userId: string): Promise<number> {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.userId === userId && s.isActive) count++;
    }
    return count;
  }

  clear(): void {
    this.devices.clear();
    this.sessions.clear();
  }
}

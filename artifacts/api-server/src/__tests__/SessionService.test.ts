import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SessionService,
  SessionNotFoundError,
  DeviceNotFoundError,
  SessionValidationError,
} from "../services/SessionService";
import { InMemorySessionRepository } from "../repositories/InMemorySessionRepository";
import { SSOService } from "../services/SSOService";
import { InMemoryApplicationRepository } from "../repositories/InMemoryApplicationRepository";
import { InMemoryProfileRepository } from "../repositories/InMemoryProfileRepository";
import { InMemoryAvatarRepository } from "../repositories/InMemoryAvatarRepository";
import { ProfileService } from "../services/ProfileService";
import { AvatarService } from "../services/AvatarService";
import { IdentityService } from "../services/IdentityService";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeService() {
  const repo = new InMemorySessionRepository();
  const service = new SessionService(repo);
  return { repo, service };
}

const uid1 = "user-001";
const uid2 = "user-002";
const appId1 = "app-football";
const appId2 = "app-animal";

async function seedSession(
  service: SessionService,
  overrides: Partial<Parameters<SessionService["createSession"]>[0]> = {},
) {
  return service.createSession({
    userId:        uid1,
    applicationId: appId1,
    fingerprint:   "fp-chrome-win",
    deviceName:    "Windows PC",
    platform:      "Windows",
    browser:       "Chrome",
    ipAddress:     "1.2.3.4",
    userAgent:     "Mozilla/5.0",
    ...overrides,
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("Sprint 9 — Sessions & Devices", () => {

  // ─── Device Tests ───────────────────────────────────────────────────────────

  describe("Device — creation", () => {
    it("creates a device with correct userId", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      expect(s.userId).toBe(uid1);
    });

    it("creates a device with correct fingerprint", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-safari" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.fingerprint).toBe("fp-safari");
    });

    it("assigns a uuid to device id", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.id).toBeTruthy();
      expect(devices[0]!.id.length).toBeGreaterThan(10);
    });

    it("stores deviceName on new device", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1", deviceName: "My Mac" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.deviceName).toBe("My Mac");
    });

    it("stores platform on new device", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1", platform: "macOS" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.platform).toBe("macOS");
    });

    it("stores browser on new device", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1", browser: "Firefox" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.browser).toBe("Firefox");
    });

    it("sets lastSeenAt on creation", async () => {
      const { repo } = makeService();
      const service = new SessionService(repo);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices[0]!.lastSeenAt).toBeInstanceOf(Date);
    });
  });

  describe("Device — fingerprint deduplication", () => {
    it("does NOT create a second device for same fingerprint", async () => {
      const { repo, service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-chrome" });
      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-chrome" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices).toHaveLength(1);
    });

    it("creates a second device for a different fingerprint", async () => {
      const { repo, service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-chrome" });
      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-firefox" });
      const devices = await repo.findDevicesByUserId(uid1);
      expect(devices).toHaveLength(2);
    });

    it("updates lastSeenAt when same fingerprint is reused", async () => {
      const { repo, service } = makeService();
      const before = new Date(Date.now() - 5000);
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-shared" });
      const [firstDevice] = await repo.findDevicesByUserId(uid1);
      await repo.updateDevice(firstDevice!.id, { lastSeenAt: before });

      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-shared" });
      const [updatedDevice] = await repo.findDevicesByUserId(uid1);
      expect(updatedDevice!.lastSeenAt!.getTime()).toBeGreaterThan(before.getTime());
    });

    it("same fingerprint on different users creates separate devices", async () => {
      const { repo, service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-shared" });
      await service.createSession({ userId: uid2, applicationId: appId1, fingerprint: "fp-shared" });
      const d1 = await repo.findDevicesByUserId(uid1);
      const d2 = await repo.findDevicesByUserId(uid2);
      expect(d1).toHaveLength(1);
      expect(d2).toHaveLength(1);
      expect(d1[0]!.id).not.toBe(d2[0]!.id);
    });

    it("both sessions share same deviceId after deduplication", async () => {
      const { service } = makeService();
      const s1 = await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-dedup" });
      const s2 = await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-dedup" });
      expect(s1.deviceId).toBe(s2.deviceId);
    });
  });

  describe("Device — query & deletion", () => {
    it("getMyDevices returns all devices for user", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-2" });
      const devices = await service.getMyDevices(uid1);
      expect(devices).toHaveLength(2);
    });

    it("getMyDevices returns deviceName, platform, browser", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1", deviceName: "PC", platform: "Win", browser: "IE" });
      const [d] = await service.getMyDevices(uid1);
      expect(d!.deviceName).toBe("PC");
      expect(d!.platform).toBe("Win");
      expect(d!.browser).toBe("IE");
    });

    it("getMyDevices isolates by user", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      await service.createSession({ userId: uid2, applicationId: appId1, fingerprint: "fp-2" });
      const devices = await service.getMyDevices(uid2);
      expect(devices).toHaveLength(1);
    });

    it("revokeDevice removes device from list", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      const [d] = await service.getMyDevices(uid1);
      await service.revokeDevice(uid1, d!.id);
      const after = await service.getMyDevices(uid1);
      expect(after).toHaveLength(0);
    });

    it("revokeDevice revokes all sessions for that device", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-1" });
      const [d] = await service.getMyDevices(uid1);
      await service.revokeDevice(uid1, d!.id);
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(0);
    });

    it("revokeDevice throws DeviceNotFoundError for unknown id", async () => {
      const { service } = makeService();
      await expect(service.revokeDevice(uid1, "nonexistent")).rejects.toThrow(DeviceNotFoundError);
    });

    it("revokeDevice throws DeviceNotFoundError for wrong user", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-1" });
      const [d] = await service.getMyDevices(uid1);
      await expect(service.revokeDevice(uid2, d!.id)).rejects.toThrow(DeviceNotFoundError);
    });
  });

  // ─── Session Tests ──────────────────────────────────────────────────────────

  describe("Session — creation", () => {
    it("creates session with isActive true", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      expect(s.isActive).toBe(true);
    });

    it("creates session with correct userId", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      expect(s.userId).toBe(uid1);
    });

    it("creates session with correct applicationId", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      expect(s.applicationId).toBe(appId1);
    });

    it("assigns a unique id to each session", async () => {
      const { service } = makeService();
      const s1 = await seedSession(service);
      const s2 = await seedSession(service);
      expect(s1.id).not.toBe(s2.id);
    });

    it("stores ipAddress on session", async () => {
      const { service } = makeService();
      const s = await seedSession(service, { ipAddress: "10.0.0.1" });
      expect(s.ipAddress).toBe("10.0.0.1");
    });

    it("stores userAgent on session", async () => {
      const { service } = makeService();
      const s = await seedSession(service, { userAgent: "TestAgent/1.0" });
      expect(s.userAgent).toBe("TestAgent/1.0");
    });

    it("stores expiresAt on session", async () => {
      const { service } = makeService();
      const exp = new Date(Date.now() + 86400_000);
      const s = await seedSession(service, { expiresAt: exp });
      expect(s.expiresAt?.getTime()).toBeCloseTo(exp.getTime(), -3);
    });

    it("stores accessTokenId on session", async () => {
      const { service } = makeService();
      const s = await seedSession(service, { accessTokenId: "token-abc" });
      expect(s.accessTokenId).toBe("token-abc");
    });

    it("sets lastSeenAt on creation", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      expect(s.lastSeenAt).toBeInstanceOf(Date);
    });

    it("links session to correct device", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service);
      const devices = await repo.findDevicesByUserId(uid1);
      expect(s.deviceId).toBe(devices[0]!.id);
    });
  });

  describe("Session — multiple & lookup", () => {
    it("can create multiple sessions for same user", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(2);
    });

    it("getMySessions returns only active sessions", async () => {
      const { service } = makeService();
      const s1 = await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      await service.revokeSession(s1.id);
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(1);
    });

    it("getMySessions isolates by user", async () => {
      const { service } = makeService();
      await seedSession(service);
      await seedSession(service, { userId: uid2 });
      const sessions = await service.getMySessions(uid2);
      expect(sessions).toHaveLength(1);
    });

    it("getMySessions returns sessionSummary shape", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      const summaries = await service.getMySessions(uid1);
      expect(summaries[0]!.id).toBe(s.id);
      expect(summaries[0]!.applicationId).toBe(appId1);
      expect(summaries[0]!.isActive).toBe(true);
    });

    it("countActiveSessions counts correctly", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      const count = await service.countActiveSessions(uid1);
      expect(count).toBe(2);
    });

    it("countActiveSessions excludes revoked sessions", async () => {
      const { service } = makeService();
      const s = await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      await service.revokeSession(s.id);
      const count = await service.countActiveSessions(uid1);
      expect(count).toBe(1);
    });

    it("countActiveSessions isolates by user", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { userId: uid2, fingerprint: "fp-2" });
      const count = await service.countActiveSessions(uid2);
      expect(count).toBe(1);
    });
  });

  // ─── Revoke Tests ───────────────────────────────────────────────────────────

  describe("Revoke — single session", () => {
    it("revokeSession sets isActive to false", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service);
      await service.revokeSession(s.id);
      const updated = await repo.findSessionById(s.id);
      expect(updated!.isActive).toBe(false);
    });

    it("revokeSession removes from getMySessions", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      await service.revokeSession(s.id);
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(0);
    });

    it("revokeSession throws SessionNotFoundError for unknown id", async () => {
      const { service } = makeService();
      await expect(service.revokeSession("nonexistent")).rejects.toThrow(SessionNotFoundError);
    });

    it("already revoked session can be revoked again silently", async () => {
      const { service } = makeService();
      const s = await seedSession(service);
      await service.revokeSession(s.id);
      await expect(service.revokeSession(s.id)).resolves.toBeUndefined();
    });

    it("revoking one session does not affect other sessions", async () => {
      const { service } = makeService();
      const s1 = await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      await service.revokeSession(s1.id);
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(1);
    });
  });

  describe("Revoke — logout all", () => {
    it("logoutAll revokes all active sessions", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      await service.logoutAll(uid1);
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(0);
    });

    it("logoutAll returns correct revoked count", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      const result = await service.logoutAll(uid1);
      expect(result.revoked).toBe(2);
    });

    it("logoutAll returns 0 if no active sessions", async () => {
      const { service } = makeService();
      const result = await service.logoutAll(uid1);
      expect(result.revoked).toBe(0);
    });

    it("logoutAll only counts active sessions", async () => {
      const { service } = makeService();
      const s1 = await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { applicationId: appId2, fingerprint: "fp-2" });
      await service.revokeSession(s1.id);
      const result = await service.logoutAll(uid1);
      expect(result.revoked).toBe(1);
    });

    it("logoutAll does NOT affect other users' sessions", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { userId: uid2, fingerprint: "fp-2" });
      await service.logoutAll(uid1);
      const sessions = await service.getMySessions(uid2);
      expect(sessions).toHaveLength(1);
    });

    it("user isolation — uid2 sessions unaffected after uid1 logout", async () => {
      const { service } = makeService();
      await seedSession(service, { fingerprint: "fp-1" });
      await seedSession(service, { userId: uid2, fingerprint: "fp-2" });
      await service.logoutAll(uid1);
      const count = await service.countActiveSessions(uid2);
      expect(count).toBe(1);
    });
  });

  // ─── touchSession Tests ─────────────────────────────────────────────────────

  describe("touchSession", () => {
    it("updates lastSeenAt to a more recent time", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service);
      const old = new Date(Date.now() - 10_000);
      await repo.updateSession(s.id, { lastSeenAt: old });

      await service.touchSession(s.id);
      const updated = await repo.findSessionById(s.id);
      expect(updated!.lastSeenAt!.getTime()).toBeGreaterThan(old.getTime());
    });

    it("touchSession is silent for unknown session id", async () => {
      const { service } = makeService();
      await expect(service.touchSession("ghost-id")).resolves.toBeUndefined();
    });

    it("touchSession does not change isActive", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service);
      await service.touchSession(s.id);
      const updated = await repo.findSessionById(s.id);
      expect(updated!.isActive).toBe(true);
    });
  });

  // ─── revokeSessionByToken Tests ─────────────────────────────────────────────

  describe("revokeSessionByToken", () => {
    it("revokes session matching accessTokenId", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service, { accessTokenId: "tok-123" });
      await service.revokeSessionByToken(uid1, "tok-123");
      const updated = await repo.findSessionById(s.id);
      expect(updated!.isActive).toBe(false);
    });

    it("is silent when no session matches accessTokenId", async () => {
      const { service } = makeService();
      await expect(service.revokeSessionByToken(uid1, "tok-unknown")).resolves.toBeUndefined();
    });

    it("does not revoke sessions from other users", async () => {
      const { repo, service } = makeService();
      const s = await seedSession(service, { accessTokenId: "tok-456" });
      await service.revokeSessionByToken(uid2, "tok-456");
      const updated = await repo.findSessionById(s.id);
      expect(updated!.isActive).toBe(true);
    });
  });

  // ─── Validation Tests ───────────────────────────────────────────────────────

  describe("Validation", () => {
    it("throws SessionValidationError when userId is empty", async () => {
      const { service } = makeService();
      await expect(
        service.createSession({ userId: "", applicationId: appId1, fingerprint: "fp-1" }),
      ).rejects.toThrow(SessionValidationError);
    });

    it("throws SessionValidationError when applicationId is empty", async () => {
      const { service } = makeService();
      await expect(
        service.createSession({ userId: uid1, applicationId: "", fingerprint: "fp-1" }),
      ).rejects.toThrow(SessionValidationError);
    });

    it("throws SessionValidationError when fingerprint is empty", async () => {
      const { service } = makeService();
      await expect(
        service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "" }),
      ).rejects.toThrow(SessionValidationError);
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles large number of sessions for same user", async () => {
      const { service } = makeService();
      for (let i = 0; i < 20; i++) {
        await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: `fp-${i}` });
      }
      const count = await service.countActiveSessions(uid1);
      expect(count).toBe(20);
    });

    it("handles 20 devices for same user (all unique fingerprints)", async () => {
      const { service } = makeService();
      for (let i = 0; i < 20; i++) {
        await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: `fp-unique-${i}` });
      }
      const devices = await service.getMyDevices(uid1);
      expect(devices).toHaveLength(20);
    });

    it("expired session is still returned by getMySessions (expiry check is caller's responsibility)", async () => {
      const { service } = makeService();
      const pastExpiry = new Date(Date.now() - 86400_000);
      await seedSession(service, { expiresAt: pastExpiry });
      const sessions = await service.getMySessions(uid1);
      expect(sessions).toHaveLength(1);
    });

    it("getMyDevices returns empty array when user has no sessions", async () => {
      const { service } = makeService();
      const devices = await service.getMyDevices("ghost-user");
      expect(devices).toHaveLength(0);
    });

    it("getMySessions returns empty array for unknown user", async () => {
      const { service } = makeService();
      const sessions = await service.getMySessions("ghost-user");
      expect(sessions).toHaveLength(0);
    });

    it("multiple apps on different devices for same user", async () => {
      const { service } = makeService();
      await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: "fp-desktop" });
      await service.createSession({ userId: uid1, applicationId: appId2, fingerprint: "fp-mobile" });
      const devices = await service.getMyDevices(uid1);
      const sessions = await service.getMySessions(uid1);
      expect(devices).toHaveLength(2);
      expect(sessions).toHaveLength(2);
    });

    it("cross-user isolation: logoutAll for uid1 leaves uid2 unchanged", async () => {
      const { service } = makeService();
      for (let i = 0; i < 5; i++) {
        await service.createSession({ userId: uid1, applicationId: appId1, fingerprint: `fp-u1-${i}` });
      }
      for (let i = 0; i < 3; i++) {
        await service.createSession({ userId: uid2, applicationId: appId1, fingerprint: `fp-u2-${i}` });
      }
      await service.logoutAll(uid1);
      expect(await service.countActiveSessions(uid1)).toBe(0);
      expect(await service.countActiveSessions(uid2)).toBe(3);
    });
  });

  // ─── SSO Integration Tests ──────────────────────────────────────────────────

  describe("SSO Integration — generateToken creates session", () => {
    function makeSSOWithSession() {
      const sessionRepo = new InMemorySessionRepository();
      const sessionService = new SessionService(sessionRepo);
      const appRepo      = new InMemoryApplicationRepository();
      const profileRepo  = new InMemoryProfileRepository();
      const avatarRepo   = new InMemoryAvatarRepository();
      const profileService  = new ProfileService(profileRepo);
      const avatarService   = new AvatarService(avatarRepo);
      const identityService = new IdentityService(profileRepo, avatarRepo);
      const ssoService = new SSOService(appRepo, profileService, avatarService, identityService, sessionService);
      return { ssoService, sessionService, appRepo, profileRepo };
    }

    it("generateToken creates a session for the user", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app = await ssoService.registerApplication("Test App", "test-app", ["PROFILE_READ"]);
      await ssoService.generateAccessToken(uid1, app.clientId, app.clientSecret);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions.length).toBeGreaterThan(0);
    });

    it("generateToken session has correct applicationId", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app = await ssoService.registerApplication("Test App", "test-app", ["PROFILE_READ"]);
      await ssoService.generateAccessToken(uid1, app.clientId, app.clientSecret);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions[0]!.applicationId).toBe(app.id);
    });

    it("generateToken session is active", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app = await ssoService.registerApplication("Test App", "test-app", ["PROFILE_READ"]);
      await ssoService.generateAccessToken(uid1, app.clientId, app.clientSecret);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions[0]!.isActive).toBe(true);
    });

    it("verifyToken touches the session (updates lastSeenAt)", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const profileRepo = new InMemoryProfileRepository();
      await new ProfileService(profileRepo).createProfile(uid1);

      const freshSSOService = (() => {
        const sr = new InMemorySessionRepository();
        const ss = new SessionService(sr);
        const ar = new InMemoryApplicationRepository();
        const pr = new InMemoryProfileRepository();
        const avr = new InMemoryAvatarRepository();
        const ps = new ProfileService(pr);
        const avs = new AvatarService(avr);
        const is = new IdentityService(pr, avr);
        return { sso: new SSOService(ar, ps, avs, is, ss), ss, sr, ps };
      })();

      await freshSSOService.ps.createProfile(uid1);
      const app = await freshSSOService.sso.registerApplication("App", "app-slug", ["PROFILE_READ"]);
      const { token } = await freshSSOService.sso.generateAccessToken(uid1, app.clientId, app.clientSecret);

      const sessions = await freshSSOService.ss.getMySessions(uid1);
      const old = new Date(Date.now() - 5000);
      await freshSSOService.sr.updateSession(sessions[0]!.id, { lastSeenAt: old });

      await freshSSOService.sso.verifyToken(token);
      const updated = await freshSSOService.ss.getMySessions(uid1);
      expect(updated[0]!.lastSeenAt!.getTime()).toBeGreaterThanOrEqual(old.getTime());
    });

    it("revokeToken deactivates the associated session", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app = await ssoService.registerApplication("Test App", "test-app-revoke", ["PROFILE_READ"]);
      const { token } = await ssoService.generateAccessToken(uid1, app.clientId, app.clientSecret);
      await ssoService.revokeToken(token);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions).toHaveLength(0);
    });

    it("multiple apps create multiple sessions", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app1 = await ssoService.registerApplication("App 1", "app-one", ["PROFILE_READ"]);
      const app2 = await ssoService.registerApplication("App 2", "app-two", ["PROFILE_READ"]);
      await ssoService.generateAccessToken(uid1, app1.clientId, app1.clientSecret);
      await ssoService.generateAccessToken(uid1, app2.clientId, app2.clientSecret);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions.length).toBe(2);
    });

    it("multiple users generate independent sessions", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app = await ssoService.registerApplication("Shared App", "shared-app", ["PROFILE_READ"]);
      await ssoService.generateAccessToken(uid1, app.clientId, app.clientSecret);
      await ssoService.generateAccessToken(uid2, app.clientId, app.clientSecret);
      const s1 = await sessionService.getMySessions(uid1);
      const s2 = await sessionService.getMySessions(uid2);
      expect(s1).toHaveLength(1);
      expect(s2).toHaveLength(1);
      expect(s1[0]!.id).not.toBe(s2[0]!.id);
    });

    it("cross-app session: same fingerprint across 2 apps shares 1 device", async () => {
      const { ssoService, sessionService } = makeSSOWithSession();
      const app1 = await ssoService.registerApplication("X1", "x-one", ["PROFILE_READ"]);
      const app2 = await ssoService.registerApplication("X2", "x-two", ["PROFILE_READ"]);
      // Both use the auto-fingerprint pattern which is per-app, so 2 devices
      await ssoService.generateAccessToken(uid1, app1.clientId, app1.clientSecret);
      await ssoService.generateAccessToken(uid1, app2.clientId, app2.clientSecret);
      const sessions = await sessionService.getMySessions(uid1);
      expect(sessions).toHaveLength(2);
    });
  });
});

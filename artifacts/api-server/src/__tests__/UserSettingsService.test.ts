import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserSettingsService, SettingsNotFoundError, SettingsValidationError } from "../services/UserSettingsService";
import { InMemoryUserSettingsRepository } from "../repositories/InMemoryUserSettingsRepository";
import { DEFAULT_SETTINGS } from "../models/userSettings";
import type { UserSettings } from "../models/userSettings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid1 = "00000000-0000-0000-0000-000000000001";
const uid2 = "00000000-0000-0000-0000-000000000002";
const uid3 = "00000000-0000-0000-0000-000000000003";

function makeService(opts?: { withActivity?: boolean; withNotification?: boolean }) {
  const repo = new InMemoryUserSettingsRepository();

  const activityService = opts?.withActivity
    ? { record: vi.fn().mockResolvedValue(undefined) }
    : undefined;

  const notificationService = opts?.withNotification
    ? { send: vi.fn().mockResolvedValue({ id: "notif-1" }) }
    : undefined;

  const service = new UserSettingsService(
    repo,
    activityService as never,
    notificationService as never,
  );

  return { repo, service, activityService, notificationService };
}

// ─── Sprint 10 — User Settings & Preferences ──────────────────────────────────

describe("Sprint 10 — User Settings & Preferences", () => {

  // ─── Auto-create & defaults ─────────────────────────────────────────────────

  describe("getMySettings — auto-create", () => {
    it("creates settings with defaults when none exist", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.userId).toBe(uid1);
    });

    it("returns default theme SYSTEM", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.theme).toBe("SYSTEM");
    });

    it("returns default language en", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.language).toBe("en");
    });

    it("returns default timezone UTC", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.timezone).toBe("UTC");
    });

    it("returns default privacyProfile PUBLIC", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.privacyProfile).toBe("PUBLIC");
    });

    it("returns default privacyActivity PUBLIC", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.privacyActivity).toBe("PUBLIC");
    });

    it("returns default privacyReputation PUBLIC", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.privacyReputation).toBe("PUBLIC");
    });

    it("returns emailNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.emailNotifications).toBe(true);
    });

    it("returns pushNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.pushNotifications).toBe(true);
    });

    it("returns marketplaceNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.marketplaceNotifications).toBe(true);
    });

    it("returns achievementNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.achievementNotifications).toBe(true);
    });

    it("returns reputationNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.reputationNotifications).toBe(true);
    });

    it("returns securityNotifications true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.securityNotifications).toBe(true);
    });

    it("returns allowFriendRequests true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.allowFriendRequests).toBe(true);
    });

    it("returns allowDirectMessages true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.allowDirectMessages).toBe(true);
    });

    it("returns showOnlineStatus true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.showOnlineStatus).toBe(true);
    });

    it("returns showLastSeen true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.showLastSeen).toBe(true);
    });

    it("auto-create is idempotent — second call returns same record", async () => {
      const { service } = makeService();
      const s1 = await service.getMySettings(uid1);
      const s2 = await service.getMySettings(uid1);
      expect(s1.id).toBe(s2.id);
    });

    it("has createdAt set after auto-create", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.createdAt).toBeInstanceOf(Date);
    });

    it("has updatedAt set after auto-create", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(s.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ─── Update theme ────────────────────────────────────────────────────────────

  describe("updateMySettings — theme", () => {
    it("updates theme to DARK", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { theme: "DARK" });
      expect(s.theme).toBe("DARK");
    });

    it("updates theme to LIGHT", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { theme: "LIGHT" });
      expect(s.theme).toBe("LIGHT");
    });

    it("updates theme to SYSTEM", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "DARK" });
      const s = await service.updateMySettings(uid1, { theme: "SYSTEM" });
      expect(s.theme).toBe("SYSTEM");
    });

    it("rejects invalid theme value", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { theme: "RAINBOW" } as never)).rejects.toThrow(SettingsValidationError);
    });
  });

  // ─── Update language ─────────────────────────────────────────────────────────

  describe("updateMySettings — language", () => {
    it("updates language to vi", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { language: "vi" });
      expect(s.language).toBe("vi");
    });

    it("updates language to ja", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { language: "ja" });
      expect(s.language).toBe("ja");
    });

    it("updates language to ko", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { language: "ko" });
      expect(s.language).toBe("ko");
    });

    it("updates language to zh", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { language: "zh" });
      expect(s.language).toBe("zh");
    });

    it("rejects invalid language value", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { language: "fr" } as never)).rejects.toThrow(SettingsValidationError);
    });
  });

  // ─── Update timezone ──────────────────────────────────────────────────────────

  describe("updateMySettings — timezone", () => {
    it("updates timezone to Asia/Ho_Chi_Minh", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { timezone: "Asia/Ho_Chi_Minh" });
      expect(s.timezone).toBe("Asia/Ho_Chi_Minh");
    });

    it("updates timezone to America/New_York", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { timezone: "America/New_York" });
      expect(s.timezone).toBe("America/New_York");
    });

    it("rejects empty timezone string", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { timezone: "" })).rejects.toThrow(SettingsValidationError);
    });
  });

  // ─── Update privacy ───────────────────────────────────────────────────────────

  describe("updateMySettings — privacy", () => {
    it("updates privacyProfile to PRIVATE", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(s.privacyProfile).toBe("PRIVATE");
    });

    it("updates privacyProfile to FRIENDS", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { privacyProfile: "FRIENDS" });
      expect(s.privacyProfile).toBe("FRIENDS");
    });

    it("updates privacyActivity to PRIVATE", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { privacyActivity: "PRIVATE" });
      expect(s.privacyActivity).toBe("PRIVATE");
    });

    it("updates privacyReputation to FRIENDS", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { privacyReputation: "FRIENDS" });
      expect(s.privacyReputation).toBe("FRIENDS");
    });

    it("rejects invalid privacy value", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { privacyProfile: "HIDDEN" } as never)).rejects.toThrow(SettingsValidationError);
    });
  });

  // ─── Update notification preferences ─────────────────────────────────────────

  describe("updateMySettings — notification preferences", () => {
    it("disables emailNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { emailNotifications: false });
      expect(s.emailNotifications).toBe(false);
    });

    it("disables pushNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { pushNotifications: false });
      expect(s.pushNotifications).toBe(false);
    });

    it("disables marketplaceNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { marketplaceNotifications: false });
      expect(s.marketplaceNotifications).toBe(false);
    });

    it("disables achievementNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { achievementNotifications: false });
      expect(s.achievementNotifications).toBe(false);
    });

    it("disables reputationNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { reputationNotifications: false });
      expect(s.reputationNotifications).toBe(false);
    });

    it("disables securityNotifications", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { securityNotifications: false });
      expect(s.securityNotifications).toBe(false);
    });

    it("re-enables achievementNotifications", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { achievementNotifications: false });
      const s = await service.updateMySettings(uid1, { achievementNotifications: true });
      expect(s.achievementNotifications).toBe(true);
    });
  });

  // ─── Update social preferences ────────────────────────────────────────────────

  describe("updateMySettings — social preferences", () => {
    it("disables allowFriendRequests", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { allowFriendRequests: false });
      expect(s.allowFriendRequests).toBe(false);
    });

    it("disables allowDirectMessages", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { allowDirectMessages: false });
      expect(s.allowDirectMessages).toBe(false);
    });

    it("disables showOnlineStatus", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { showOnlineStatus: false });
      expect(s.showOnlineStatus).toBe(false);
    });

    it("disables showLastSeen", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { showLastSeen: false });
      expect(s.showLastSeen).toBe(false);
    });
  });

  // ─── Partial updates ──────────────────────────────────────────────────────────

  describe("updateMySettings — partial updates", () => {
    it("partial update theme only does not change language", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { language: "vi" });
      const s = await service.updateMySettings(uid1, { theme: "DARK" });
      expect(s.language).toBe("vi");
      expect(s.theme).toBe("DARK");
    });

    it("partial update language only does not change theme", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "LIGHT" });
      const s = await service.updateMySettings(uid1, { language: "ja" });
      expect(s.theme).toBe("LIGHT");
      expect(s.language).toBe("ja");
    });

    it("multi-field partial: theme + language together", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { theme: "DARK", language: "vi" });
      expect(s.theme).toBe("DARK");
      expect(s.language).toBe("vi");
    });

    it("partial privacy update does not affect notifications", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { achievementNotifications: false });
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(s.achievementNotifications).toBe(false);
      expect(s.privacyProfile).toBe("PRIVATE");
    });

    it("updating social does not affect privacy", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { privacyProfile: "FRIENDS" });
      const s = await service.updateMySettings(uid1, { showLastSeen: false });
      expect(s.privacyProfile).toBe("FRIENDS");
      expect(s.showLastSeen).toBe(false);
    });

    it("rejects empty object (no fields)", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, {})).rejects.toThrow(SettingsValidationError);
    });
  });

  // ─── Validation errors ────────────────────────────────────────────────────────

  describe("validation errors", () => {
    it("throws SettingsValidationError for invalid theme", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { theme: "BLUE" } as never)).rejects.toThrow(SettingsValidationError);
    });

    it("throws SettingsValidationError for invalid language", async () => {
      const { service } = makeService();
      await expect(service.updateMySettings(uid1, { language: "de" } as never)).rejects.toThrow(SettingsValidationError);
    });

    it("error name is SettingsValidationError", async () => {
      const { service } = makeService();
      try {
        await service.updateMySettings(uid1, { theme: "BAD" } as never);
      } catch (err) {
        expect((err as Error).name).toBe("SettingsValidationError");
      }
    });
  });

  // ─── Privacy resolver ─────────────────────────────────────────────────────────

  describe("canViewProfile — privacy resolver", () => {
    let service: UserSettingsService;
    let settings: UserSettings;

    beforeEach(async () => {
      ({ service } = makeService());
      settings = await service.getMySettings(uid1);
    });

    it("PUBLIC profile — OWNER can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PUBLIC" });
      expect(service.canViewProfile(s, "OWNER")).toBe(true);
    });

    it("PUBLIC profile — FRIEND can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PUBLIC" });
      expect(service.canViewProfile(s, "FRIEND")).toBe(true);
    });

    it("PUBLIC profile — PUBLIC can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PUBLIC" });
      expect(service.canViewProfile(s, "PUBLIC")).toBe(true);
    });

    it("FRIENDS profile — OWNER can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "FRIENDS" });
      expect(service.canViewProfile(s, "OWNER")).toBe(true);
    });

    it("FRIENDS profile — FRIEND can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "FRIENDS" });
      expect(service.canViewProfile(s, "FRIEND")).toBe(true);
    });

    it("FRIENDS profile — PUBLIC cannot view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "FRIENDS" });
      expect(service.canViewProfile(s, "PUBLIC")).toBe(false);
    });

    it("PRIVATE profile — OWNER can view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(service.canViewProfile(s, "OWNER")).toBe(true);
    });

    it("PRIVATE profile — FRIEND cannot view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(service.canViewProfile(s, "FRIEND")).toBe(false);
    });

    it("PRIVATE profile — PUBLIC cannot view", async () => {
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(service.canViewProfile(s, "PUBLIC")).toBe(false);
    });
  });

  // ─── Notification resolver ────────────────────────────────────────────────────

  describe("shouldSendNotification — notification resolver", () => {
    it("ACHIEVEMENT → true when achievementNotifications is true", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(service.shouldSendNotification(s, "ACHIEVEMENT")).toBe(true);
    });

    it("ACHIEVEMENT → false when achievementNotifications is false", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { achievementNotifications: false });
      expect(service.shouldSendNotification(s, "ACHIEVEMENT")).toBe(false);
    });

    it("REPUTATION → true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(service.shouldSendNotification(s, "REPUTATION")).toBe(true);
    });

    it("REPUTATION → false when disabled", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { reputationNotifications: false });
      expect(service.shouldSendNotification(s, "REPUTATION")).toBe(false);
    });

    it("MARKETPLACE → true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(service.shouldSendNotification(s, "MARKETPLACE")).toBe(true);
    });

    it("MARKETPLACE → false when disabled", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { marketplaceNotifications: false });
      expect(service.shouldSendNotification(s, "MARKETPLACE")).toBe(false);
    });

    it("SECURITY → true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(service.shouldSendNotification(s, "SECURITY")).toBe(true);
    });

    it("SECURITY → false when disabled", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { securityNotifications: false });
      expect(service.shouldSendNotification(s, "SECURITY")).toBe(false);
    });

    it("SYSTEM → true by default", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      expect(service.shouldSendNotification(s, "SYSTEM")).toBe(true);
    });

    it("SYSTEM → false when pushNotifications disabled", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { pushNotifications: false });
      expect(service.shouldSendNotification(s, "SYSTEM")).toBe(false);
    });
  });

  // ─── Reset settings ───────────────────────────────────────────────────────────

  describe("resetSettings", () => {
    it("resets theme to SYSTEM", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "DARK" });
      const s = await service.resetSettings(uid1);
      expect(s.theme).toBe("SYSTEM");
    });

    it("resets language to en", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { language: "vi" });
      const s = await service.resetSettings(uid1);
      expect(s.language).toBe("en");
    });

    it("resets privacyProfile to PUBLIC", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      const s = await service.resetSettings(uid1);
      expect(s.privacyProfile).toBe("PUBLIC");
    });

    it("resets achievementNotifications to true", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { achievementNotifications: false });
      const s = await service.resetSettings(uid1);
      expect(s.achievementNotifications).toBe(true);
    });

    it("resets showLastSeen to true", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { showLastSeen: false });
      const s = await service.resetSettings(uid1);
      expect(s.showLastSeen).toBe(true);
    });

    it("reset is idempotent — double reset still gives defaults", async () => {
      const { service } = makeService();
      await service.resetSettings(uid1);
      const s = await service.resetSettings(uid1);
      expect(s.theme).toBe("SYSTEM");
      expect(s.language).toBe("en");
    });

    it("reset creates settings if they never existed", async () => {
      const { service } = makeService();
      const s = await service.resetSettings(uid2);
      expect(s.userId).toBe(uid2);
      expect(s.theme).toBe("SYSTEM");
    });
  });

  // ─── Activity integration ─────────────────────────────────────────────────────

  describe("activity integration", () => {
    it("records activity when settings are updated", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.updateMySettings(uid1, { theme: "DARK" });
      expect(activityService!.record).toHaveBeenCalledOnce();
    });

    it("activity title is 'Settings Updated' on update", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.updateMySettings(uid1, { theme: "DARK" });
      const call = activityService!.record.mock.calls[0][0];
      expect(call.title).toBe("Settings Updated");
    });

    it("activity sourceApp is 'universe-account' on update", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.updateMySettings(uid1, { theme: "DARK" });
      const call = activityService!.record.mock.calls[0][0];
      expect(call.sourceApp).toBe("universe-account");
    });

    it("activity type is ACCOUNT on update", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.updateMySettings(uid1, { theme: "DARK" });
      const call = activityService!.record.mock.calls[0][0];
      expect(call.type).toBe("ACCOUNT");
    });

    it("records activity when settings are reset", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.resetSettings(uid1);
      expect(activityService!.record).toHaveBeenCalledOnce();
    });

    it("activity title is 'Settings Reset' on reset", async () => {
      const { service, activityService } = makeService({ withActivity: true });
      await service.resetSettings(uid1);
      const call = activityService!.record.mock.calls[0][0];
      expect(call.title).toBe("Settings Reset");
    });

    it("no activity crash when activityService is absent", async () => {
      const { service } = makeService({ withActivity: false });
      await expect(service.updateMySettings(uid1, { theme: "DARK" })).resolves.toBeDefined();
    });
  });

  // ─── Notification integration ─────────────────────────────────────────────────

  describe("notification integration", () => {
    it("sends notification when privacyProfile changes", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(notificationService!.send).toHaveBeenCalled();
    });

    it("sends notification when privacyActivity changes", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { privacyActivity: "FRIENDS" });
      expect(notificationService!.send).toHaveBeenCalled();
    });

    it("sends notification when privacyReputation changes", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { privacyReputation: "PRIVATE" });
      expect(notificationService!.send).toHaveBeenCalled();
    });

    it("privacy notification type is ACCOUNT", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      const call = notificationService!.send.mock.calls[0][0];
      expect(call.type).toBe("ACCOUNT");
    });

    it("privacy notification priority is NORMAL", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      const call = notificationService!.send.mock.calls[0][0];
      expect(call.priority).toBe("NORMAL");
    });

    it("sends HIGH priority notification when securityNotifications is disabled", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { securityNotifications: false });
      const calls = (notificationService!.send.mock.calls as unknown as Array<[{ type: string; priority: string }]>).map((c) => c[0]);
      const securityCall = calls.find((c) => c.type === "SECURITY");
      expect(securityCall).toBeDefined();
      expect(securityCall!.priority).toBe("HIGH");
    });

    it("does NOT send security notification when securityNotifications stays true", async () => {
      const { service, notificationService } = makeService({ withNotification: true });
      await service.updateMySettings(uid1, { theme: "DARK" });
      const calls = (notificationService!.send.mock.calls as unknown as Array<[{ type: string }]>).map((c) => c[0]);
      const securityCall = calls.find((c) => c.type === "SECURITY");
      expect(securityCall).toBeUndefined();
    });

    it("no crash when notificationService is absent", async () => {
      const { service } = makeService({ withNotification: false });
      await expect(service.updateMySettings(uid1, { privacyProfile: "PRIVATE" })).resolves.toBeDefined();
    });
  });

  // ─── Persistence ──────────────────────────────────────────────────────────────

  describe("persistence", () => {
    it("persists changes across getMySettings calls", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "DARK", language: "vi" });
      const s = await service.getMySettings(uid1);
      expect(s.theme).toBe("DARK");
      expect(s.language).toBe("vi");
    });

    it("updatedAt changes after update", async () => {
      const { service } = makeService();
      const s1 = await service.getMySettings(uid1);
      await new Promise((r) => setTimeout(r, 5));
      const s2 = await service.updateMySettings(uid1, { theme: "DARK" });
      expect(s2.updatedAt!.getTime()).toBeGreaterThanOrEqual(s1.updatedAt!.getTime());
    });

    it("createdAt stays the same after update", async () => {
      const { service } = makeService();
      const s1 = await service.getMySettings(uid1);
      const s2 = await service.updateMySettings(uid1, { theme: "DARK" });
      expect(s2.createdAt!.getTime()).toBe(s1.createdAt!.getTime());
    });
  });

  // ─── User isolation ────────────────────────────────────────────────────────────

  describe("user isolation", () => {
    it("two users have independent settings", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "DARK" });
      const s2 = await service.getMySettings(uid2);
      expect(s2.theme).toBe("SYSTEM");
    });

    it("updating user1 does not affect user2", async () => {
      const { service } = makeService();
      await service.getMySettings(uid1);
      await service.getMySettings(uid2);
      await service.updateMySettings(uid1, { language: "vi" });
      const s2 = await service.getMySettings(uid2);
      expect(s2.language).toBe("en");
    });

    it("resetting user1 does not affect user2", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, { theme: "DARK" });
      await service.updateMySettings(uid2, { theme: "LIGHT" });
      await service.resetSettings(uid1);
      const s2 = await service.getMySettings(uid2);
      expect(s2.theme).toBe("LIGHT");
    });
  });

  // ─── Multi-user scenarios ─────────────────────────────────────────────────────

  describe("multi-user scenarios", () => {
    it("three users each get their own default settings", async () => {
      const { service } = makeService();
      const [s1, s2, s3] = await Promise.all([
        service.getMySettings(uid1),
        service.getMySettings(uid2),
        service.getMySettings(uid3),
      ]);
      expect(s1.userId).toBe(uid1);
      expect(s2.userId).toBe(uid2);
      expect(s3.userId).toBe(uid3);
      expect(s1.id).not.toBe(s2.id);
      expect(s2.id).not.toBe(s3.id);
    });

    it("concurrent updates to different users do not conflict", async () => {
      const { service } = makeService();
      await Promise.all([
        service.updateMySettings(uid1, { theme: "DARK" }),
        service.updateMySettings(uid2, { theme: "LIGHT" }),
        service.updateMySettings(uid3, { language: "vi" }),
      ]);
      const [s1, s2, s3] = await Promise.all([
        service.getMySettings(uid1),
        service.getMySettings(uid2),
        service.getMySettings(uid3),
      ]);
      expect(s1.theme).toBe("DARK");
      expect(s2.theme).toBe("LIGHT");
      expect(s3.language).toBe("vi");
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("all notification types disabled independently", async () => {
      const { service } = makeService();
      await service.updateMySettings(uid1, {
        emailNotifications: false,
        pushNotifications: false,
        marketplaceNotifications: false,
        achievementNotifications: false,
        reputationNotifications: false,
        securityNotifications: false,
      });
      const s = await service.getMySettings(uid1);
      expect(s.emailNotifications).toBe(false);
      expect(s.pushNotifications).toBe(false);
      expect(s.marketplaceNotifications).toBe(false);
      expect(s.achievementNotifications).toBe(false);
      expect(s.reputationNotifications).toBe(false);
      expect(s.securityNotifications).toBe(false);
    });

    it("all privacy fields set to PRIVATE", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, {
        privacyProfile: "PRIVATE",
        privacyActivity: "PRIVATE",
        privacyReputation: "PRIVATE",
      });
      expect(s.privacyProfile).toBe("PRIVATE");
      expect(s.privacyActivity).toBe("PRIVATE");
      expect(s.privacyReputation).toBe("PRIVATE");
    });

    it("all social settings disabled", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, {
        allowFriendRequests: false,
        allowDirectMessages: false,
        showOnlineStatus: false,
        showLastSeen: false,
      });
      expect(s.allowFriendRequests).toBe(false);
      expect(s.allowDirectMessages).toBe(false);
      expect(s.showOnlineStatus).toBe(false);
      expect(s.showLastSeen).toBe(false);
    });

    it("PRIVATE profile + OWNER relation → canViewProfile is true", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { privacyProfile: "PRIVATE" });
      expect(service.canViewProfile(s, "OWNER")).toBe(true);
    });

    it("DEFAULT_SETTINGS has all expected keys", () => {
      const keys = Object.keys(DEFAULT_SETTINGS);
      expect(keys).toContain("theme");
      expect(keys).toContain("language");
      expect(keys).toContain("timezone");
      expect(keys).toContain("privacyProfile");
      expect(keys).toContain("securityNotifications");
      expect(keys).toContain("showLastSeen");
    });

    it("update with only boolean false values succeeds", async () => {
      const { service } = makeService();
      const s = await service.updateMySettings(uid1, { showLastSeen: false });
      expect(s.showLastSeen).toBe(false);
    });

    it("getMySettings returns object with all required fields", async () => {
      const { service } = makeService();
      const s = await service.getMySettings(uid1);
      const requiredKeys: (keyof UserSettings)[] = [
        "id", "userId", "theme", "language", "timezone",
        "privacyProfile", "privacyActivity", "privacyReputation",
        "emailNotifications", "pushNotifications",
        "marketplaceNotifications", "achievementNotifications",
        "reputationNotifications", "securityNotifications",
        "allowFriendRequests", "allowDirectMessages",
        "showOnlineStatus", "showLastSeen",
        "createdAt", "updatedAt",
      ];
      for (const key of requiredKeys) {
        expect(s).toHaveProperty(key);
      }
    });
  });
});

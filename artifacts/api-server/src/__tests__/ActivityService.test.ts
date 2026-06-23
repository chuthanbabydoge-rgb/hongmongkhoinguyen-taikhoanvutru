import { describe, it, expect, beforeEach } from "vitest";
import { ActivityService, ActivityNotFoundError, ActivityValidationError } from "../services/ActivityService";
import { AchievementService } from "../services/AchievementService";
import { NotificationService } from "../services/NotificationService";
import { ReputationService } from "../services/ReputationService";
import { InMemoryActivityRepository } from "../repositories/InMemoryActivityRepository";
import { InMemoryAchievementRepository } from "../repositories/InMemoryAchievementRepository";
import { InMemoryNotificationRepository } from "../repositories/InMemoryNotificationRepository";
import { InMemoryReputationRepository } from "../repositories/InMemoryReputationRepository";
import { ActivityType, ActivityVisibility } from "../models/activity";

describe("Sprint 7 — Activity Feed (Universe Timeline)", () => {
  let activityRepo: InMemoryActivityRepository;
  let activityService: ActivityService;

  const base = {
    userId: "user-001",
    type: ActivityType.SPORT,
    sourceApp: "football-universe",
    title: "First Match Victory",
    description: "Bạn đã thắng trận đầu tiên.",
  };

  beforeEach(() => {
    activityRepo = new InMemoryActivityRepository();
    activityService = new ActivityService(activityRepo);
  });

  // ─── createActivity ────────────────────────────────────────────────────────

  describe("createActivity", () => {
    it("creates and returns an activity", async () => {
      const a = await activityService.createActivity(base);
      expect(a.id).toBeTruthy();
      expect(a.title).toBe("First Match Victory");
      expect(a.userId).toBe("user-001");
    });

    it("default visibility is PUBLIC", async () => {
      const a = await activityService.createActivity(base);
      expect(a.visibility).toBe(ActivityVisibility.PUBLIC);
    });

    it("stores FRIENDS visibility", async () => {
      const a = await activityService.createActivity({ ...base, visibility: ActivityVisibility.FRIENDS });
      expect(a.visibility).toBe(ActivityVisibility.FRIENDS);
    });

    it("stores PRIVATE visibility", async () => {
      const a = await activityService.createActivity({ ...base, visibility: ActivityVisibility.PRIVATE });
      expect(a.visibility).toBe(ActivityVisibility.PRIVATE);
    });

    it("stores description", async () => {
      const a = await activityService.createActivity(base);
      expect(a.description).toBe("Bạn đã thắng trận đầu tiên.");
    });

    it("stores metadata", async () => {
      const a = await activityService.createActivity({ ...base, metadata: { matchId: "x1", score: "3-1" } });
      expect(a.metadata).toEqual({ matchId: "x1", score: "3-1" });
    });

    it("stores large metadata object", async () => {
      const bigMeta = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`key${i}`, `val${i}`]));
      const a = await activityService.createActivity({ ...base, metadata: bigMeta });
      expect(Object.keys(a.metadata!)).toHaveLength(20);
    });

    it("sets createdAt timestamp", async () => {
      const a = await activityService.createActivity(base);
      expect(a.createdAt).toBeInstanceOf(Date);
    });

    it("each activity gets unique ID", async () => {
      const a1 = await activityService.createActivity(base);
      const a2 = await activityService.createActivity(base);
      expect(a1.id).not.toBe(a2.id);
    });

    it("throws ActivityValidationError when userId missing", async () => {
      await expect(activityService.createActivity({ ...base, userId: "" }))
        .rejects.toThrow(ActivityValidationError);
    });

    it("throws ActivityValidationError when title missing", async () => {
      await expect(activityService.createActivity({ ...base, title: "" }))
        .rejects.toThrow(ActivityValidationError);
    });

    it("throws ActivityValidationError when type is invalid", async () => {
      await expect(activityService.createActivity({ ...base, type: "INVALID_TYPE" as ActivityType }))
        .rejects.toThrow(ActivityValidationError);
    });

    it("throws ActivityValidationError when sourceApp missing", async () => {
      await expect(activityService.createActivity({ ...base, sourceApp: "" }))
        .rejects.toThrow(ActivityValidationError);
    });

    it("creates ACCOUNT type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.ACCOUNT });
      expect(a.type).toBe(ActivityType.ACCOUNT);
    });

    it("creates WORLD type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.WORLD, sourceApp: "world-creator" });
      expect(a.type).toBe(ActivityType.WORLD);
    });

    it("creates MARKETPLACE type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.MARKETPLACE, sourceApp: "marketplace" });
      expect(a.type).toBe(ActivityType.MARKETPLACE);
    });

    it("creates SAFEPASS type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.SAFEPASS, sourceApp: "safepass" });
      expect(a.type).toBe(ActivityType.SAFEPASS);
    });

    it("creates EXCHANGE type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.EXCHANGE, sourceApp: "exchange-hub" });
      expect(a.type).toBe(ActivityType.EXCHANGE);
    });

    it("creates SYSTEM type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.SYSTEM, sourceApp: "universe-account" });
      expect(a.type).toBe(ActivityType.SYSTEM);
    });

    it("creates ANIMAL type activity", async () => {
      const a = await activityService.createActivity({ ...base, type: ActivityType.ANIMAL, sourceApp: "animal-evolution" });
      expect(a.type).toBe(ActivityType.ANIMAL);
    });
  });

  // ─── getMyActivities ───────────────────────────────────────────────────────

  describe("getMyActivities", () => {
    it("returns empty array when no activities", async () => {
      const list = await activityService.getMyActivities("user-001");
      expect(list).toHaveLength(0);
    });

    it("returns activities for the user", async () => {
      await activityService.createActivity(base);
      await activityService.createActivity(base);
      const list = await activityService.getMyActivities("user-001");
      expect(list).toHaveLength(2);
    });

    it("returns newest first", async () => {
      const a1 = await activityService.createActivity({ ...base, title: "First" });
      await new Promise((r) => setTimeout(r, 2));
      const a2 = await activityService.createActivity({ ...base, title: "Second" });
      const list = await activityService.getMyActivities("user-001");
      expect(list[0]!.id).toBe(a2.id);
      expect(list[1]!.id).toBe(a1.id);
    });

    it("respects limit", async () => {
      for (let i = 0; i < 5; i++) await activityService.createActivity({ ...base, title: `A${i}` });
      const list = await activityService.getMyActivities("user-001", { limit: 2 });
      expect(list).toHaveLength(2);
    });

    it("respects offset", async () => {
      for (let i = 0; i < 4; i++) await activityService.createActivity({ ...base, title: `A${i}` });
      const page1 = await activityService.getMyActivities("user-001", { limit: 2, offset: 0 });
      const page2 = await activityService.getMyActivities("user-001", { limit: 2, offset: 2 });
      expect(page1[0]!.id).not.toBe(page2[0]!.id);
    });

    it("isolates activities by user", async () => {
      await activityService.createActivity({ ...base, userId: "user-001" });
      await activityService.createActivity({ ...base, userId: "user-002" });
      const list = await activityService.getMyActivities("user-001");
      expect(list).toHaveLength(1);
      expect(list[0]!.userId).toBe("user-001");
    });
  });

  // ─── getFeed ──────────────────────────────────────────────────────────────

  describe("getFeed", () => {
    it("returns empty feed when no activities", async () => {
      const list = await activityService.getFeed(20, 0);
      expect(list).toHaveLength(0);
    });

    it("returns only PUBLIC activities in feed", async () => {
      await activityService.createActivity({ ...base, visibility: ActivityVisibility.PUBLIC });
      await activityService.createActivity({ ...base, visibility: ActivityVisibility.PRIVATE });
      await activityService.createActivity({ ...base, visibility: ActivityVisibility.FRIENDS });
      const list = await activityService.getFeed(20, 0);
      expect(list).toHaveLength(1);
      expect(list[0]!.visibility).toBe(ActivityVisibility.PUBLIC);
    });

    it("feed is sorted newest first", async () => {
      const a1 = await activityService.createActivity({ ...base, title: "Old" });
      await new Promise((r) => setTimeout(r, 2));
      const a2 = await activityService.createActivity({ ...base, title: "New" });
      const list = await activityService.getFeed(20, 0);
      expect(list[0]!.id).toBe(a2.id);
      expect(list[1]!.id).toBe(a1.id);
    });

    it("feed respects limit", async () => {
      for (let i = 0; i < 5; i++) await activityService.createActivity({ ...base, title: `A${i}` });
      const list = await activityService.getFeed(3, 0);
      expect(list).toHaveLength(3);
    });

    it("feed respects offset", async () => {
      for (let i = 0; i < 4; i++) await activityService.createActivity({ ...base, title: `A${i}` });
      const page1 = await activityService.getFeed(2, 0);
      const page2 = await activityService.getFeed(2, 2);
      expect(page1[0]!.id).not.toBe(page2[0]!.id);
    });

    it("feed includes activities from multiple users", async () => {
      await activityService.createActivity({ ...base, userId: "user-001" });
      await activityService.createActivity({ ...base, userId: "user-002" });
      const list = await activityService.getFeed(20, 0);
      expect(list).toHaveLength(2);
    });
  });

  // ─── countActivities ──────────────────────────────────────────────────────

  describe("countActivities", () => {
    it("returns 0 when no activities", async () => {
      expect(await activityService.countActivities("user-001")).toBe(0);
    });

    it("returns correct count", async () => {
      await activityService.createActivity(base);
      await activityService.createActivity(base);
      expect(await activityService.countActivities("user-001")).toBe(2);
    });

    it("counts per user", async () => {
      await activityService.createActivity({ ...base, userId: "user-001" });
      await activityService.createActivity({ ...base, userId: "user-002" });
      await activityService.createActivity({ ...base, userId: "user-002" });
      expect(await activityService.countActivities("user-001")).toBe(1);
      expect(await activityService.countActivities("user-002")).toBe(2);
    });
  });

  // ─── deleteActivity ───────────────────────────────────────────────────────

  describe("deleteActivity", () => {
    it("deletes an activity by id", async () => {
      const a = await activityService.createActivity(base);
      await activityService.deleteActivity(a.id);
      const list = await activityService.getMyActivities("user-001");
      expect(list).toHaveLength(0);
    });

    it("throws ActivityNotFoundError for unknown id", async () => {
      await expect(
        activityService.deleteActivity("00000000-0000-0000-0000-000000000000")
      ).rejects.toThrow(ActivityNotFoundError);
    });

    it("delete is isolated — does not remove other user's activities", async () => {
      const a1 = await activityService.createActivity({ ...base, userId: "user-001" });
      await activityService.createActivity({ ...base, userId: "user-002" });
      await activityService.deleteActivity(a1.id);
      const list2 = await activityService.getMyActivities("user-002");
      expect(list2).toHaveLength(1);
    });
  });

  // ─── Achievement integration ──────────────────────────────────────────────

  describe("Achievement auto-activity integration", () => {
    let achievementRepo: InMemoryAchievementRepository;
    let achievementService: AchievementService;

    beforeEach(async () => {
      achievementRepo = new InMemoryAchievementRepository();
      achievementService = new AchievementService(achievementRepo, activityService);
      await achievementService.initialize();
    });

    it("auto-creates ACHIEVEMENT activity when granting achievement", async () => {
      await achievementService.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "universe-account",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(1);
      expect(activities[0]!.type).toBe(ActivityType.ACHIEVEMENT);
    });

    it("achievement activity has achievement name as title", async () => {
      await achievementService.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "universe-account",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities[0]!.title).toBe("First Login");
    });

    it("achievement activity sourceApp is grantedBy", async () => {
      await achievementService.grantAchievementByKey({
        userId: "user-001",
        key: "FIRST_LOGIN",
        grantedBy: "football-universe",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities[0]!.sourceApp).toBe("football-universe");
    });

    it("duplicate achievement grant does NOT create second activity", async () => {
      await achievementService.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      await achievementService.grantAchievementByKey({ userId: "user-001", key: "FIRST_LOGIN", grantedBy: "system" });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(1);
    });
  });

  // ─── Notification integration ─────────────────────────────────────────────

  describe("Notification auto-activity integration", () => {
    let notificationRepo: InMemoryNotificationRepository;
    let notificationService: NotificationService;

    beforeEach(() => {
      notificationRepo = new InMemoryNotificationRepository();
      notificationService = new NotificationService(notificationRepo, activityService);
    });

    it("HIGH priority notification creates NOTIFICATION activity", async () => {
      await notificationService.send({
        userId: "user-001",
        type: "ACCOUNT",
        title: "Security Alert",
        message: "A new login was detected.",
        sourceApp: "safepass",
        priority: "HIGH",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(1);
      expect(activities[0]!.type).toBe(ActivityType.NOTIFICATION);
    });

    it("URGENT priority notification creates NOTIFICATION activity", async () => {
      await notificationService.send({
        userId: "user-001",
        type: "SECURITY",
        title: "Critical Alert",
        message: "Immediate action required.",
        sourceApp: "safepass",
        priority: "URGENT",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(1);
      expect(activities[0]!.type).toBe(ActivityType.NOTIFICATION);
    });

    it("NORMAL priority notification does NOT create activity", async () => {
      await notificationService.send({
        userId: "user-001",
        type: "MARKETPLACE",
        title: "Item Sold",
        message: "Your item was sold.",
        sourceApp: "marketplace",
        priority: "NORMAL",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(0);
    });

    it("LOW priority notification does NOT create activity", async () => {
      await notificationService.send({
        userId: "user-001",
        type: "SYSTEM",
        title: "System Update",
        message: "System maintenance at midnight.",
        sourceApp: "universe-account",
        priority: "LOW",
      });
      const activities = await activityService.getMyActivities("user-001");
      expect(activities).toHaveLength(0);
    });
  });

  // ─── Reputation level-up integration ─────────────────────────────────────

  describe("Reputation level-up auto-activity integration", () => {
    let repRepo: InMemoryReputationRepository;
    let notifRepo: InMemoryNotificationRepository;
    let notifService: NotificationService;
    let repService: ReputationService;

    beforeEach(() => {
      repRepo = new InMemoryReputationRepository();
      notifRepo = new InMemoryNotificationRepository();
      notifService = new NotificationService(notifRepo);
      repService = new ReputationService(repRepo, notifService, activityService);
    });

    it("level-up creates REPUTATION activity", async () => {
      await repService.addReputation("user-001", 100, "system", "BONUS");
      const activities = await activityService.getMyActivities("user-001");
      const repActivity = activities.find((a) => a.type === ActivityType.REPUTATION);
      expect(repActivity).toBeDefined();
    });

    it("reputation activity title is 'Level Up'", async () => {
      await repService.addReputation("user-001", 100, "system", "BONUS");
      const activities = await activityService.getMyActivities("user-001");
      const repActivity = activities.find((a) => a.type === ActivityType.REPUTATION);
      expect(repActivity!.title).toBe("Level Up");
    });

    it("no REPUTATION activity when level does not change", async () => {
      await repService.addReputation("user-001", 10, "system", "BONUS");
      await repService.addReputation("user-001", 5, "system", "BONUS2");
      const activities = await activityService.getMyActivities("user-001");
      const repActivities = activities.filter((a) => a.type === ActivityType.REPUTATION);
      expect(repActivities).toHaveLength(0);
    });
  });

  // ─── getActivitiesByUserId ────────────────────────────────────────────────

  describe("getActivitiesByUserId", () => {
    it("returns activities for given userId", async () => {
      await activityService.createActivity({ ...base, userId: "user-002" });
      const list = await activityService.getActivitiesByUserId("user-002");
      expect(list).toHaveLength(1);
      expect(list[0]!.userId).toBe("user-002");
    });

    it("returns empty array for unknown userId", async () => {
      const list = await activityService.getActivitiesByUserId("ghost");
      expect(list).toHaveLength(0);
    });
  });

  // ─── persistence & ordering ───────────────────────────────────────────────

  describe("activity persistence and ordering", () => {
    it("creates many activities without collision", async () => {
      for (let i = 0; i < 10; i++) {
        await activityService.createActivity({ ...base, title: `Activity ${i}` });
      }
      const list = await activityService.getMyActivities("user-001");
      expect(list).toHaveLength(10);
      const ids = list.map((a) => a.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(10);
    });

    it("activities are persisted and retrievable by user", async () => {
      const created = await activityService.createActivity(base);
      const list = await activityService.getMyActivities("user-001");
      expect(list.some((a) => a.id === created.id)).toBe(true);
    });
  });
});

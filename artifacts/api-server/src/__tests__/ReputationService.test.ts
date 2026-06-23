import { describe, it, expect, beforeEach } from "vitest";
import {
  ReputationService,
  ReputationNotFoundError,
  ReputationValidationError,
} from "../services/ReputationService";
import { NotificationService } from "../services/NotificationService";
import { InMemoryReputationRepository } from "../repositories/InMemoryReputationRepository";
import { InMemoryNotificationRepository } from "../repositories/InMemoryNotificationRepository";
import {
  calculateLevel,
  getBadgeForLevel,
  ReputationLevel,
} from "../models/reputation";

describe("Sprint 6 — Universe Reputation System", () => {
  let reputationRepo: InMemoryReputationRepository;
  let notificationRepo: InMemoryNotificationRepository;
  let notificationService: NotificationService;
  let service: ReputationService;

  beforeEach(() => {
    reputationRepo = new InMemoryReputationRepository();
    notificationRepo = new InMemoryNotificationRepository();
    notificationService = new NotificationService(notificationRepo);
    service = new ReputationService(reputationRepo, notificationService);
  });

  // ─── calculateLevel helper ─────────────────────────────────────────────────

  describe("calculateLevel", () => {
    it("0 → CITIZEN", () => expect(calculateLevel(0)).toBe(ReputationLevel.CITIZEN));
    it("99 → CITIZEN", () => expect(calculateLevel(99)).toBe(ReputationLevel.CITIZEN));
    it("100 → TRUSTED", () => expect(calculateLevel(100)).toBe(ReputationLevel.TRUSTED));
    it("499 → TRUSTED", () => expect(calculateLevel(499)).toBe(ReputationLevel.TRUSTED));
    it("500 → ELITE", () => expect(calculateLevel(500)).toBe(ReputationLevel.ELITE));
    it("999 → ELITE", () => expect(calculateLevel(999)).toBe(ReputationLevel.ELITE));
    it("1000 → LEGEND", () => expect(calculateLevel(1000)).toBe(ReputationLevel.LEGEND));
    it("4999 → LEGEND", () => expect(calculateLevel(4999)).toBe(ReputationLevel.LEGEND));
    it("5000 → MYTHIC", () => expect(calculateLevel(5000)).toBe(ReputationLevel.MYTHIC));
    it("99999 → MYTHIC", () => expect(calculateLevel(99999)).toBe(ReputationLevel.MYTHIC));
  });

  // ─── getBadgeForLevel helper ──────────────────────────────────────────────

  describe("getBadgeForLevel", () => {
    it("CITIZEN → 🟢", () => expect(getBadgeForLevel(ReputationLevel.CITIZEN)).toBe("🟢"));
    it("TRUSTED → 🔵", () => expect(getBadgeForLevel(ReputationLevel.TRUSTED)).toBe("🔵"));
    it("ELITE → 🟣",   () => expect(getBadgeForLevel(ReputationLevel.ELITE)).toBe("🟣"));
    it("LEGEND → 🟠",  () => expect(getBadgeForLevel(ReputationLevel.LEGEND)).toBe("🟠"));
    it("MYTHIC → 🔴",  () => expect(getBadgeForLevel(ReputationLevel.MYTHIC)).toBe("🔴"));
  });

  // ─── getMyReputation / getReputation ─────────────────────────────────────

  describe("getMyReputation", () => {
    it("auto-creates reputation if none exists", async () => {
      const rep = await service.getMyReputation("user-001");
      expect(rep.userId).toBe("user-001");
      expect(rep.score).toBe(0);
      expect(rep.level).toBe(ReputationLevel.CITIZEN);
    });

    it("returns existing reputation without duplication", async () => {
      await service.getMyReputation("user-001");
      await service.getMyReputation("user-001");
      const rep = await service.getMyReputation("user-001");
      expect(rep.score).toBe(0);
    });

    it("getReputation auto-creates for any userId", async () => {
      const rep = await service.getReputation("user-002");
      expect(rep.userId).toBe("user-002");
    });
  });

  // ─── addReputation ────────────────────────────────────────────────────────

  describe("addReputation", () => {
    it("adds points to score", async () => {
      const rep = await service.addReputation("user-001", 50, "football-universe", "WIN_MATCH");
      expect(rep.score).toBe(50);
    });

    it("increments positiveEvents counter", async () => {
      const rep = await service.addReputation("user-001", 50, "football-universe", "WIN_MATCH");
      expect(rep.positiveEvents).toBe(1);
    });

    it("accumulates multiple add calls", async () => {
      await service.addReputation("user-001", 50, "football-universe", "WIN_MATCH");
      await service.addReputation("user-001", 60, "marketplace", "GOOD_SELLER");
      const rep = await service.getMyReputation("user-001");
      expect(rep.score).toBe(110);
      expect(rep.positiveEvents).toBe(2);
    });

    it("sets lastActivityAt after adding", async () => {
      const rep = await service.addReputation("user-001", 10, "system", "FIRST_LOGIN");
      expect(rep.lastActivityAt).toBeInstanceOf(Date);
    });

    it("auto-creates reputation and adds in one call", async () => {
      const rep = await service.addReputation("new-user", 25, "system", "SIGNUP_BONUS");
      expect(rep.userId).toBe("new-user");
      expect(rep.score).toBe(25);
    });

    it("stores sourceApp on event", async () => {
      await service.addReputation("user-001", 50, "football-universe", "WIN_MATCH");
      const history = await service.getHistory("user-001");
      expect(history[0]!.sourceApp).toBe("football-universe");
    });

    it("stores reason on event", async () => {
      await service.addReputation("user-001", 50, "football-universe", "WIN_MATCH");
      const history = await service.getHistory("user-001");
      expect(history[0]!.reason).toBe("WIN_MATCH");
    });

    it("throws ReputationValidationError when points is 0", async () => {
      await expect(
        service.addReputation("user-001", 0, "system", "REASON")
      ).rejects.toThrow(ReputationValidationError);
    });

    it("throws ReputationValidationError when points is negative", async () => {
      await expect(
        service.addReputation("user-001", -10, "system", "REASON")
      ).rejects.toThrow(ReputationValidationError);
    });
  });

  // ─── deductReputation ────────────────────────────────────────────────────

  describe("deductReputation", () => {
    it("subtracts points from score", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      const rep = await service.deductReputation("user-001", 25, "marketplace", "FRAUD_REPORT");
      expect(rep.score).toBe(75);
    });

    it("increments negativeEvents counter", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      const rep = await service.deductReputation("user-001", 25, "marketplace", "FRAUD_REPORT");
      expect(rep.negativeEvents).toBe(1);
    });

    it("score can go negative", async () => {
      const rep = await service.deductReputation("user-001", 50, "system", "PENALTY");
      expect(rep.score).toBe(-50);
    });

    it("sets lastActivityAt after deducting", async () => {
      const rep = await service.deductReputation("user-001", 10, "system", "PENALTY");
      expect(rep.lastActivityAt).toBeInstanceOf(Date);
    });

    it("saves event with negative points value", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      await service.deductReputation("user-001", 25, "marketplace", "FRAUD_REPORT");
      const history = await service.getHistory("user-001");
      const deductEvent = history.find((e) => e.points < 0);
      expect(deductEvent).toBeDefined();
      expect(deductEvent!.points).toBe(-25);
    });
  });

  // ─── Level system ─────────────────────────────────────────────────────────

  describe("level progression", () => {
    it("starts at CITIZEN", async () => {
      const rep = await service.getMyReputation("user-001");
      expect(rep.level).toBe(ReputationLevel.CITIZEN);
    });

    it("reaches TRUSTED at 100 points", async () => {
      const rep = await service.addReputation("user-001", 100, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.TRUSTED);
    });

    it("reaches ELITE at 500 points", async () => {
      const rep = await service.addReputation("user-001", 500, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.ELITE);
    });

    it("reaches LEGEND at 1000 points", async () => {
      const rep = await service.addReputation("user-001", 1000, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.LEGEND);
    });

    it("reaches MYTHIC at 5000 points", async () => {
      const rep = await service.addReputation("user-001", 5000, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.MYTHIC);
    });

    it("stays CITIZEN below 100", async () => {
      const rep = await service.addReputation("user-001", 99, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.CITIZEN);
    });

    it("handles large score correctly", async () => {
      const rep = await service.addReputation("user-001", 100_000, "system", "BONUS");
      expect(rep.level).toBe(ReputationLevel.MYTHIC);
      expect(rep.score).toBe(100_000);
    });
  });

  // ─── Level-up notifications ───────────────────────────────────────────────

  describe("level-up notifications", () => {
    it("sends notification when reaching TRUSTED", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      const notifications = await notificationService.getMyNotifications("user-001");
      expect(notifications).toHaveLength(1);
      expect(notifications[0]!.title).toBe("🎉 Thăng cấp danh tiếng");
      expect(notifications[0]!.priority).toBe("HIGH");
    });

    it("sends notification when reaching ELITE", async () => {
      await service.addReputation("user-001", 500, "system", "BONUS");
      const notifications = await notificationService.getMyNotifications("user-001");
      const levelUpNotif = notifications.find((n) => n.message.includes("ELITE"));
      expect(levelUpNotif).toBeDefined();
    });

    it("sends notification when reaching LEGEND", async () => {
      await service.addReputation("user-001", 1000, "system", "BONUS");
      const notifications = await notificationService.getMyNotifications("user-001");
      const levelUpNotif = notifications.find((n) => n.message.includes("LEGEND"));
      expect(levelUpNotif).toBeDefined();
    });

    it("sends notification when reaching MYTHIC", async () => {
      await service.addReputation("user-001", 5000, "system", "BONUS");
      const notifications = await notificationService.getMyNotifications("user-001");
      const levelUpNotif = notifications.find((n) => n.message.includes("MYTHIC"));
      expect(levelUpNotif).toBeDefined();
    });

    it("does NOT send notification when level stays the same", async () => {
      await service.addReputation("user-001", 10, "system", "FIRST");
      await service.addReputation("user-001", 10, "system", "SECOND");
      const notifications = await notificationService.getMyNotifications("user-001");
      expect(notifications).toHaveLength(0);
    });

    it("notification sourceApp is universe-account", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      const notifications = await notificationService.getMyNotifications("user-001");
      expect(notifications[0]!.sourceApp).toBe("universe-account");
    });

    it("no notification when deducting without level change", async () => {
      await service.addReputation("user-001", 200, "system", "BONUS");
      const beforeCount = (await notificationService.getMyNotifications("user-001")).length;
      await service.deductReputation("user-001", 10, "marketplace", "PENALTY");
      const afterCount = (await notificationService.getMyNotifications("user-001")).length;
      expect(afterCount).toBe(beforeCount);
    });
  });

  // ─── History ──────────────────────────────────────────────────────────────

  describe("getHistory", () => {
    it("returns empty array when no events", async () => {
      const history = await service.getHistory("user-001");
      expect(history).toHaveLength(0);
    });

    it("returns events for a user", async () => {
      await service.addReputation("user-001", 50, "system", "BONUS");
      await service.addReputation("user-001", 30, "marketplace", "SALE");
      const history = await service.getHistory("user-001");
      expect(history).toHaveLength(2);
    });

    it("events contain persistedAt timestamp", async () => {
      await service.addReputation("user-001", 50, "system", "BONUS");
      const history = await service.getHistory("user-001");
      expect(history[0]!.createdAt).toBeInstanceOf(Date);
    });

    it("isolates events per user", async () => {
      await service.addReputation("user-001", 50, "system", "BONUS");
      await service.addReputation("user-002", 80, "system", "BONUS");
      const history1 = await service.getHistory("user-001");
      const history2 = await service.getHistory("user-002");
      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
    });
  });

  // ─── Leaderboard ──────────────────────────────────────────────────────────

  describe("getLeaderboard", () => {
    it("returns empty leaderboard when no users", async () => {
      const lb = await service.getLeaderboard(10);
      expect(lb).toHaveLength(0);
    });

    it("returns users sorted by score descending", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      await service.addReputation("user-002", 500, "system", "BONUS");
      await service.addReputation("user-003", 50,  "system", "BONUS");
      const lb = await service.getLeaderboard(10);
      expect(lb[0]!.userId).toBe("user-002");
      expect(lb[1]!.userId).toBe("user-001");
      expect(lb[2]!.userId).toBe("user-003");
    });

    it("respects limit parameter", async () => {
      for (let i = 1; i <= 5; i++) {
        await service.addReputation(`user-00${i}`, i * 10, "system", "BONUS");
      }
      const lb = await service.getLeaderboard(3);
      expect(lb).toHaveLength(3);
    });

    it("includes badge on each leaderboard entry", async () => {
      await service.addReputation("user-001", 150, "system", "BONUS");
      const lb = await service.getLeaderboard(10);
      expect(lb[0]!.badge).toBe("🔵");
    });

    it("includes level on each leaderboard entry", async () => {
      await service.addReputation("user-001", 1000, "system", "BONUS");
      const lb = await service.getLeaderboard(10);
      expect(lb[0]!.level).toBe(ReputationLevel.LEGEND);
    });
  });

  // ─── User isolation ────────────────────────────────────────────────────────

  describe("user isolation", () => {
    it("multiple users have independent reputations", async () => {
      await service.addReputation("user-001", 100, "system", "BONUS");
      await service.addReputation("user-002", 500, "system", "BONUS");
      const rep1 = await service.getMyReputation("user-001");
      const rep2 = await service.getMyReputation("user-002");
      expect(rep1.score).toBe(100);
      expect(rep2.score).toBe(500);
    });
  });
});

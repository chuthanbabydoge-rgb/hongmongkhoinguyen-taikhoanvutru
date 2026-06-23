import { describe, it, expect, beforeEach } from "vitest";
import {
  NotificationService,
  NotificationNotFoundError,
  NotificationValidationError,
} from "../services/NotificationService";
import { InMemoryNotificationRepository } from "../repositories/InMemoryNotificationRepository";
import { NotificationType, NotificationPriority, NotificationStatus } from "../models/notification";

describe("Sprint 5 — Notification Center", () => {
  let repo: InMemoryNotificationRepository;
  let service: NotificationService;

  const base = {
    userId: "user-001",
    type: NotificationType.MARKETPLACE,
    title: "Item Sold",
    message: "Your Plasma Armor was sold.",
    sourceApp: "marketplace",
  };

  beforeEach(() => {
    repo = new InMemoryNotificationRepository();
    service = new NotificationService(repo);
  });

  // ─── send ─────────────────────────────────────────────────────────────────

  describe("send", () => {
    it("creates a notification and returns it", async () => {
      const n = await service.send(base);
      expect(n.id).toBeTruthy();
      expect(n.title).toBe("Item Sold");
      expect(n.userId).toBe("user-001");
    });

    it("default status is UNREAD", async () => {
      const n = await service.send(base);
      expect(n.status).toBe(NotificationStatus.UNREAD);
    });

    it("default priority is NORMAL when omitted", async () => {
      const n = await service.send(base);
      expect(n.priority).toBe(NotificationPriority.NORMAL);
    });

    it("stores provided priority HIGH", async () => {
      const n = await service.send({ ...base, priority: NotificationPriority.HIGH });
      expect(n.priority).toBe(NotificationPriority.HIGH);
    });

    it("stores URGENT priority", async () => {
      const n = await service.send({ ...base, priority: NotificationPriority.URGENT });
      expect(n.priority).toBe(NotificationPriority.URGENT);
    });

    it("stores metadata on the notification", async () => {
      const n = await service.send({ ...base, metadata: { listingId: "abc-123" } });
      expect(n.metadata).toEqual({ listingId: "abc-123" });
    });

    it("stores sourceApp correctly", async () => {
      const n = await service.send({ ...base, sourceApp: "football-universe" });
      expect(n.sourceApp).toBe("football-universe");
    });

    it("stores actionUrl when provided", async () => {
      const n = await service.send({ ...base, actionUrl: "https://example.com/orders/1" });
      expect(n.actionUrl).toBe("https://example.com/orders/1");
    });

    it("actionUrl is null when not provided", async () => {
      const n = await service.send(base);
      expect(n.actionUrl).toBeNull();
    });

    it("createdAt is set on creation", async () => {
      const n = await service.send(base);
      expect(n.createdAt).toBeInstanceOf(Date);
    });

    it("readAt is null on creation", async () => {
      const n = await service.send(base);
      expect(n.readAt).toBeNull();
    });

    it("throws NotificationValidationError when userId missing", async () => {
      await expect(
        service.send({ ...base, userId: "" })
      ).rejects.toThrow(NotificationValidationError);
    });

    it("throws NotificationValidationError when title missing", async () => {
      await expect(
        service.send({ ...base, title: "" })
      ).rejects.toThrow(NotificationValidationError);
    });

    it("throws NotificationValidationError when type is invalid", async () => {
      await expect(
        service.send({ ...base, type: "INVALID_TYPE" as NotificationType })
      ).rejects.toThrow(NotificationValidationError);
    });

    it("throws NotificationValidationError when sourceApp missing", async () => {
      await expect(
        service.send({ ...base, sourceApp: "" })
      ).rejects.toThrow(NotificationValidationError);
    });

    it("sends ACHIEVEMENT type notification", async () => {
      const n = await service.send({ ...base, type: NotificationType.ACHIEVEMENT });
      expect(n.type).toBe(NotificationType.ACHIEVEMENT);
    });

    it("sends SECURITY type notification", async () => {
      const n = await service.send({ ...base, type: NotificationType.SECURITY });
      expect(n.type).toBe(NotificationType.SECURITY);
    });
  });

  // ─── getMyNotifications ───────────────────────────────────────────────────

  describe("getMyNotifications", () => {
    it("returns empty array when user has no notifications", async () => {
      const list = await service.getMyNotifications("user-001");
      expect(list).toHaveLength(0);
    });

    it("returns notifications for a user", async () => {
      await service.send(base);
      await service.send({ ...base, title: "Another" });
      const list = await service.getMyNotifications("user-001");
      expect(list).toHaveLength(2);
    });

    it("returns newest first by default", async () => {
      const n1 = await service.send({ ...base, title: "First" });
      await new Promise((r) => setTimeout(r, 2));
      const n2 = await service.send({ ...base, title: "Second" });
      const list = await service.getMyNotifications("user-001");
      expect(list[0]!.id).toBe(n2.id);
      expect(list[1]!.id).toBe(n1.id);
    });

    it("returns oldest first when sort=asc", async () => {
      const n1 = await service.send({ ...base, title: "First" });
      await new Promise((r) => setTimeout(r, 2));
      const n2 = await service.send({ ...base, title: "Second" });
      const list = await service.getMyNotifications("user-001", { sort: "asc" });
      expect(list[0]!.id).toBe(n1.id);
      expect(list[1]!.id).toBe(n2.id);
    });

    it("filters by status UNREAD", async () => {
      const n = await service.send(base);
      await service.markRead(n.id, "user-001");
      await service.send({ ...base, title: "New" });
      const list = await service.getMyNotifications("user-001", { status: NotificationStatus.UNREAD });
      expect(list).toHaveLength(1);
      expect(list[0]!.title).toBe("New");
    });

    it("filters by type", async () => {
      await service.send({ ...base, type: NotificationType.SPORT });
      await service.send({ ...base, type: NotificationType.MARKETPLACE });
      const list = await service.getMyNotifications("user-001", { type: NotificationType.SPORT });
      expect(list).toHaveLength(1);
      expect(list[0]!.type).toBe(NotificationType.SPORT);
    });

    it("filters by priority HIGH", async () => {
      await service.send(base);
      await service.send({ ...base, priority: NotificationPriority.HIGH });
      const list = await service.getMyNotifications("user-001", { priority: NotificationPriority.HIGH });
      expect(list).toHaveLength(1);
      expect(list[0]!.priority).toBe(NotificationPriority.HIGH);
    });

    it("paginates with limit", async () => {
      for (let i = 0; i < 5; i++) await service.send({ ...base, title: `N${i}` });
      const list = await service.getMyNotifications("user-001", { limit: 2 });
      expect(list).toHaveLength(2);
    });

    it("paginates with offset", async () => {
      for (let i = 0; i < 5; i++) await service.send({ ...base, title: `N${i}` });
      const page1 = await service.getMyNotifications("user-001", { limit: 2, offset: 0 });
      const page2 = await service.getMyNotifications("user-001", { limit: 2, offset: 2 });
      expect(page1[0]!.id).not.toBe(page2[0]!.id);
    });

    it("isolates notifications by user", async () => {
      await service.send({ ...base, userId: "user-001" });
      await service.send({ ...base, userId: "user-002", title: "Other" });
      const list = await service.getMyNotifications("user-001");
      expect(list).toHaveLength(1);
      expect(list[0]!.userId).toBe("user-001");
    });
  });

  // ─── countUnread ──────────────────────────────────────────────────────────

  describe("countUnread", () => {
    it("returns 0 when no notifications", async () => {
      const { unread } = await service.countUnread("user-001");
      expect(unread).toBe(0);
    });

    it("counts only unread notifications", async () => {
      await service.send(base);
      await service.send(base);
      const n3 = await service.send(base);
      await service.markRead(n3.id, "user-001");
      const { unread } = await service.countUnread("user-001");
      expect(unread).toBe(2);
    });

    it("does not count notifications from other users", async () => {
      await service.send({ ...base, userId: "user-002" });
      const { unread } = await service.countUnread("user-001");
      expect(unread).toBe(0);
    });
  });

  // ─── markRead ─────────────────────────────────────────────────────────────

  describe("markRead", () => {
    it("marks a notification as READ and sets readAt", async () => {
      const n = await service.send(base);
      const updated = await service.markRead(n.id, "user-001");
      expect(updated.status).toBe(NotificationStatus.READ);
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it("marking read twice is idempotent (created=READ, not error)", async () => {
      const n = await service.send(base);
      await service.markRead(n.id, "user-001");
      const second = await service.markRead(n.id, "user-001");
      expect(second.status).toBe(NotificationStatus.READ);
    });

    it("throws NotificationNotFoundError for wrong userId", async () => {
      const n = await service.send(base);
      await expect(service.markRead(n.id, "user-002")).rejects.toThrow(NotificationNotFoundError);
    });

    it("throws NotificationNotFoundError for non-existent id", async () => {
      await expect(
        service.markRead("00000000-0000-0000-0000-000000000000", "user-001")
      ).rejects.toThrow(NotificationNotFoundError);
    });
  });

  // ─── markAllRead ──────────────────────────────────────────────────────────

  describe("markAllRead", () => {
    it("marks all unread notifications as read", async () => {
      await service.send(base);
      await service.send(base);
      await service.send(base);
      const updated = await service.markAllRead("user-001");
      expect(updated).toBe(3);
      const { unread } = await service.countUnread("user-001");
      expect(unread).toBe(0);
    });

    it("returns 0 when no unread notifications", async () => {
      const updated = await service.markAllRead("user-001");
      expect(updated).toBe(0);
    });

    it("does not touch notifications of other users", async () => {
      await service.send({ ...base, userId: "user-002" });
      await service.markAllRead("user-001");
      const { unread } = await service.countUnread("user-002");
      expect(unread).toBe(1);
    });
  });

  // ─── archive ──────────────────────────────────────────────────────────────

  describe("archive", () => {
    it("archives a notification (status → ARCHIVED)", async () => {
      const n = await service.send(base);
      const archived = await service.archive(n.id, "user-001");
      expect(archived.status).toBe(NotificationStatus.ARCHIVED);
    });

    it("archived notifications appear in ARCHIVED filter", async () => {
      const n = await service.send(base);
      await service.archive(n.id, "user-001");
      const list = await service.getMyNotifications("user-001", { status: NotificationStatus.ARCHIVED });
      expect(list).toHaveLength(1);
    });

    it("throws NotificationNotFoundError for wrong userId", async () => {
      const n = await service.send(base);
      await expect(service.archive(n.id, "user-002")).rejects.toThrow(NotificationNotFoundError);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("deletes a notification permanently", async () => {
      const n = await service.send(base);
      await service.delete(n.id, "user-001");
      const list = await service.getMyNotifications("user-001");
      expect(list).toHaveLength(0);
    });

    it("throws NotificationNotFoundError for wrong userId", async () => {
      const n = await service.send(base);
      await expect(service.delete(n.id, "user-002")).rejects.toThrow(NotificationNotFoundError);
    });

    it("throws NotificationNotFoundError for non-existent id", async () => {
      await expect(
        service.delete("00000000-0000-0000-0000-000000000000", "user-001")
      ).rejects.toThrow(NotificationNotFoundError);
    });
  });

  // ─── Multi-user isolation ──────────────────────────────────────────────────

  describe("multi-user isolation", () => {
    it("each user has independent notification lists", async () => {
      await service.send({ ...base, userId: "user-001", title: "For 001" });
      await service.send({ ...base, userId: "user-002", title: "For 002" });
      const list1 = await service.getMyNotifications("user-001");
      const list2 = await service.getMyNotifications("user-002");
      expect(list1).toHaveLength(1);
      expect(list2).toHaveLength(1);
      expect(list1[0]!.title).toBe("For 001");
      expect(list2[0]!.title).toBe("For 002");
    });
  });
});

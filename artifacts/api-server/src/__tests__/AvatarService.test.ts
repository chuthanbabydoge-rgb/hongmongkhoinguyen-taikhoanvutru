import { describe, it, expect, beforeEach } from "vitest";
import { AvatarService, AvatarNotFoundError, AvatarValidationError, AvatarRepositoryError } from "../services/AvatarService";
import { InMemoryAvatarRepository } from "../repositories/InMemoryAvatarRepository";
import { DEFAULT_AVATAR } from "../models/avatar";

describe("AvatarService", () => {
  let repo: InMemoryAvatarRepository;
  let service: AvatarService;

  beforeEach(() => {
    repo = new InMemoryAvatarRepository();
    service = new AvatarService(repo);
  });

  // ─── Create / getOrCreate ─────────────────────────────────────────────────

  describe("getOrCreateAvatar", () => {
    it("creates a default avatar when none exists", async () => {
      const { avatar, created } = await service.getOrCreateAvatar("user-001");
      expect(created).toBe(true);
      expect(avatar.userId).toBe("user-001");
      expect(avatar.frame).toBe(DEFAULT_AVATAR.frame);
      expect(avatar.background).toBe(DEFAULT_AVATAR.background);
      expect(avatar.avatarName).toBe(DEFAULT_AVATAR.avatarName);
      expect(avatar.title).toBe(DEFAULT_AVATAR.title);
      expect(avatar.accessories).toEqual([]);
    });

    it("returns existing avatar without creating a duplicate (created=false)", async () => {
      await service.getOrCreateAvatar("user-001");
      const { avatar, created } = await service.getOrCreateAvatar("user-001");
      expect(created).toBe(false);
      expect(avatar.userId).toBe("user-001");
    });

    it("each user gets their own avatar", async () => {
      const { avatar: a1 } = await service.getOrCreateAvatar("user-001");
      const { avatar: a2 } = await service.getOrCreateAvatar("user-002");
      expect(a1.id).not.toBe(a2.id);
      expect(a1.userId).toBe("user-001");
      expect(a2.userId).toBe("user-002");
    });

    it("created avatar has id and timestamps", async () => {
      const { avatar } = await service.getOrCreateAvatar("user-001");
      expect(avatar.id).toBeTruthy();
      expect(avatar.createdAt).toBeInstanceOf(Date);
      expect(avatar.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ─── getMyAvatar ──────────────────────────────────────────────────────────

  describe("getMyAvatar", () => {
    it("returns existing avatar for userId", async () => {
      await service.getOrCreateAvatar("user-001");
      const avatar = await service.getMyAvatar("user-001");
      expect(avatar.userId).toBe("user-001");
    });

    it("throws AvatarNotFoundError when avatar does not exist", async () => {
      await expect(service.getMyAvatar("ghost-user")).rejects.toThrow(
        AvatarNotFoundError
      );
    });

    it("AvatarNotFoundError message contains userId", async () => {
      await expect(service.getMyAvatar("ghost-user")).rejects.toThrow(
        "ghost-user"
      );
    });
  });

  // ─── Update Avatar ────────────────────────────────────────────────────────

  describe("updateMyAvatar", () => {
    beforeEach(async () => {
      await service.getOrCreateAvatar("user-001");
    });

    it("updates avatarName", async () => {
      const updated = await service.updateMyAvatar("user-001", { avatarName: "Nova" });
      expect(updated.avatarName).toBe("Nova");
    });

    it("updates frame", async () => {
      const updated = await service.updateMyAvatar("user-001", { frame: "frame-crystal" });
      expect(updated.frame).toBe("frame-crystal");
    });

    it("updates background", async () => {
      const updated = await service.updateMyAvatar("user-001", { background: "bg-nebula-blue" });
      expect(updated.background).toBe("bg-nebula-blue");
    });

    it("updates title", async () => {
      const updated = await service.updateMyAvatar("user-001", { title: "Explorer" });
      expect(updated.title).toBe("Explorer");
    });

    it("updates accessories array", async () => {
      const updated = await service.updateMyAvatar("user-001", { accessories: ["badge-explorer", "badge-trader"] });
      expect(updated.accessories).toEqual(["badge-explorer", "badge-trader"]);
    });

    it("updates multiple fields at once", async () => {
      const updated = await service.updateMyAvatar("user-001", {
        avatarName: "Commander",
        frame: "frame-gold",
        background: "bg-aurora",
      });
      expect(updated.avatarName).toBe("Commander");
      expect(updated.frame).toBe("frame-gold");
      expect(updated.background).toBe("bg-aurora");
    });

    it("bumps updatedAt after update", async () => {
      const before = await service.getMyAvatar("user-001");
      await new Promise((r) => setTimeout(r, 2));
      const updated = await service.updateMyAvatar("user-001", { avatarName: "Delta" });
      expect(updated.updatedAt!.getTime()).toBeGreaterThanOrEqual(before.updatedAt!.getTime());
    });

    it("throws AvatarNotFoundError for unknown user", async () => {
      await expect(
        service.updateMyAvatar("ghost-user", { avatarName: "Ghost" })
      ).rejects.toThrow(AvatarNotFoundError);
    });
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  describe("validation", () => {
    beforeEach(async () => {
      await service.getOrCreateAvatar("user-001");
    });

    it("rejects avatarName longer than 50 chars", async () => {
      await expect(
        service.updateMyAvatar("user-001", { avatarName: "a".repeat(51) })
      ).rejects.toThrow(AvatarValidationError);
    });

    it("accepts avatarName exactly 50 chars", async () => {
      const updated = await service.updateMyAvatar("user-001", { avatarName: "a".repeat(50) });
      expect(updated.avatarName).toHaveLength(50);
    });

    it("rejects title longer than 50 chars", async () => {
      await expect(
        service.updateMyAvatar("user-001", { title: "b".repeat(51) })
      ).rejects.toThrow(AvatarValidationError);
    });

    it("accepts title exactly 50 chars", async () => {
      const updated = await service.updateMyAvatar("user-001", { title: "b".repeat(50) });
      expect(updated.title).toHaveLength(50);
    });

    it("throws AvatarValidationError (not generic Error) on invalid input", async () => {
      const err = await service.updateMyAvatar("user-001", { avatarName: "x".repeat(51) }).catch((e) => e);
      expect(err).toBeInstanceOf(AvatarValidationError);
      expect(err.name).toBe("AvatarValidationError");
    });
  });

  // ─── Reset Avatar ─────────────────────────────────────────────────────────

  describe("resetMyAvatar", () => {
    it("resets all fields to defaults", async () => {
      await service.getOrCreateAvatar("user-001");
      await service.updateMyAvatar("user-001", {
        avatarName: "Commander",
        frame: "frame-diamond",
        background: "bg-singularity",
        title: "Void Sovereign",
        accessories: ["badge-champion"],
      });

      const reset = await service.resetMyAvatar("user-001");

      expect(reset.avatarName).toBe(DEFAULT_AVATAR.avatarName);
      expect(reset.frame).toBe(DEFAULT_AVATAR.frame);
      expect(reset.background).toBe(DEFAULT_AVATAR.background);
      expect(reset.title).toBe(DEFAULT_AVATAR.title);
      expect(reset.accessories).toEqual([]);
    });

    it("preserves userId and id after reset", async () => {
      const { avatar: original } = await service.getOrCreateAvatar("user-001");
      const reset = await service.resetMyAvatar("user-001");
      expect(reset.userId).toBe("user-001");
      expect(reset.id).toBe(original.id);
    });

    it("creates default avatar on reset if none exists", async () => {
      const avatar = await service.resetMyAvatar("new-user");
      expect(avatar.frame).toBe(DEFAULT_AVATAR.frame);
      expect(avatar.avatarName).toBe(DEFAULT_AVATAR.avatarName);
    });
  });

  // ─── Repository error propagation ────────────────────────────────────────

  describe("repository error handling", () => {
    it("wraps findByUserId errors in AvatarRepositoryError", async () => {
      const brokenRepo = {
        findByUserId: () => Promise.reject(new Error("DB down")),
        create: () => Promise.reject(new Error("DB down")),
        update: () => Promise.reject(new Error("DB down")),
        reset: () => Promise.reject(new Error("DB down")),
        deleteByUserId: () => Promise.reject(new Error("DB down")),
      };
      const svc = new AvatarService(brokenRepo);
      await expect(svc.getOrCreateAvatar("user-001")).rejects.toThrow(
        AvatarRepositoryError
      );
    });
  });
});

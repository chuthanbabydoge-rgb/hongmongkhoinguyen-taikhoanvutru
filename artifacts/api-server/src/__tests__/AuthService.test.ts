import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AuthService,
  AuthValidationError,
  DuplicateEmailError,
  DuplicateUsernameError,
  InvalidCredentialsError,
  InvalidTokenError,
  TokenRevokedError,
  TokenExpiredError,
} from "../services/AuthService";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { InMemoryRefreshTokenRepository } from "../repositories/InMemoryRefreshTokenRepository";
import { InMemoryProfileRepository } from "../repositories/InMemoryProfileRepository";
import { InMemoryAvatarRepository } from "../repositories/InMemoryAvatarRepository";
import { InMemoryActivityRepository } from "../repositories/InMemoryActivityRepository";
import { InMemoryNotificationRepository } from "../repositories/InMemoryNotificationRepository";
import { InMemoryReputationRepository } from "../repositories/InMemoryReputationRepository";
import { InMemoryUserSettingsRepository } from "../repositories/InMemoryUserSettingsRepository";
import { ProfileService } from "../services/ProfileService";
import { AvatarService } from "../services/AvatarService";
import { ActivityService } from "../services/ActivityService";
import { NotificationService } from "../services/NotificationService";
import { ReputationService } from "../services/ReputationService";
import { UserSettingsService } from "../services/UserSettingsService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeService(deps = {}) {
  const userRepo = new InMemoryUserRepository();
  const tokenRepo = new InMemoryRefreshTokenRepository();
  const service = new AuthService(userRepo, tokenRepo, deps);
  return { service, userRepo, tokenRepo };
}

function makeFullService() {
  const userRepo = new InMemoryUserRepository();
  const tokenRepo = new InMemoryRefreshTokenRepository();
  const profileRepo = new InMemoryProfileRepository();
  const avatarRepo = new InMemoryAvatarRepository();
  const activityRepo = new InMemoryActivityRepository();
  const notificationRepo = new InMemoryNotificationRepository();
  const reputationRepo = new InMemoryReputationRepository();
  const settingsRepo = new InMemoryUserSettingsRepository();

  const activityService = new ActivityService(activityRepo);
  const notificationService = new NotificationService(notificationRepo, activityService);
  const profileService = new ProfileService(profileRepo);
  const avatarService = new AvatarService(avatarRepo);
  const reputationService = new ReputationService(reputationRepo, notificationService, activityService);
  const userSettingsService = new UserSettingsService(settingsRepo, activityService, notificationService);

  const service = new AuthService(userRepo, tokenRepo, {
    profileService,
    avatarService,
    activityService,
    notificationService,
    reputationService,
    userSettingsService,
  });

  return {
    service,
    userRepo,
    tokenRepo,
    profileRepo,
    avatarRepo,
    activityRepo,
    notificationRepo,
    reputationRepo,
    settingsRepo,
  };
}

const validRegister = {
  email: "nova@universe.io",
  username: "nova_star",
  password: "password123",
};

const validLogin = {
  email: "nova@universe.io",
  password: "password123",
};

// ─── Register ─────────────────────────────────────────────────────────────────

describe("Sprint AUTH-1 — AuthService", () => {
  describe("register", () => {
    it("returns user and tokens on success", async () => {
      const { service } = makeService();
      const { user, tokens } = await service.register(validRegister);
      expect(user.id).toBeTruthy();
      expect(user.email).toBe("nova@universe.io");
      expect(user.username).toBe("nova_star");
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.expiresIn).toBe(900);
    });

    it("stores lowercased email", async () => {
      const { service } = makeService();
      const { user } = await service.register({ ...validRegister, email: "NOVA@UNIVERSE.IO" });
      expect(user.email).toBe("nova@universe.io");
    });

    it("stores lowercased username", async () => {
      const { service } = makeService();
      const { user } = await service.register({ ...validRegister, username: "NOVA_Star" });
      expect(user.username).toBe("nova_star");
    });

    it("sets emailVerified to false by default", async () => {
      const { service } = makeService();
      const { user } = await service.register(validRegister);
      expect(user.emailVerified).toBe(false);
    });

    it("stores a bcrypt hash — not the raw password", async () => {
      const { service, userRepo } = makeService();
      await service.register(validRegister);
      const stored = await userRepo.findByEmail("nova@universe.io");
      expect(stored?.passwordHash).not.toBe("password123");
      expect(stored?.passwordHash).toMatch(/^\$2[ab]\$/);
    });

    it("throws DuplicateEmailError on duplicate email", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      await expect(
        service.register({ ...validRegister, username: "other_user" })
      ).rejects.toThrow(DuplicateEmailError);
    });

    it("DuplicateEmailError message contains the email", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      await expect(
        service.register({ ...validRegister, username: "other_user" })
      ).rejects.toThrow("nova@universe.io");
    });

    it("throws DuplicateUsernameError on duplicate username", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      await expect(
        service.register({ ...validRegister, email: "other@universe.io" })
      ).rejects.toThrow(DuplicateUsernameError);
    });

    it("DuplicateUsernameError message contains the username", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      await expect(
        service.register({ ...validRegister, email: "other@universe.io" })
      ).rejects.toThrow("nova_star");
    });

    it("throws AuthValidationError for invalid email", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, email: "not-an-email" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for password shorter than 8 chars", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, password: "short" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for password exactly 7 chars", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, password: "1234567" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("accepts password of exactly 8 chars", async () => {
      const { service } = makeService();
      const { user } = await service.register({ ...validRegister, password: "12345678" });
      expect(user.id).toBeTruthy();
    });

    it("throws AuthValidationError for username shorter than 3 chars", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, username: "ab" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for username with special chars", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, username: "no spaces!" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for username longer than 30 chars", async () => {
      const { service } = makeService();
      await expect(
        service.register({ ...validRegister, username: "a".repeat(31) })
      ).rejects.toThrow(AuthValidationError);
    });

    it("accepts username of exactly 30 chars", async () => {
      const { service } = makeService();
      const { user } = await service.register({ ...validRegister, username: "a".repeat(30) });
      expect(user.id).toBeTruthy();
    });

    it("throws AuthValidationError for missing email", async () => {
      const { service } = makeService();
      await expect(
        service.register({ username: "nova_star", password: "password123" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for missing password", async () => {
      const { service } = makeService();
      await expect(
        service.register({ email: "nova@universe.io", username: "nova_star" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for missing username", async () => {
      const { service } = makeService();
      await expect(
        service.register({ email: "nova@universe.io", password: "password123" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("accepts username with underscores and numbers", async () => {
      const { service } = makeService();
      const { user } = await service.register({ ...validRegister, username: "nova_123" });
      expect(user.username).toBe("nova_123");
    });

    it("multiple users register independently", async () => {
      const { service, userRepo } = makeService();
      await service.register({ email: "a@universe.io", username: "user_a", password: "password123" });
      await service.register({ email: "b@universe.io", username: "user_b", password: "password123" });
      await service.register({ email: "c@universe.io", username: "user_c", password: "password123" });
      expect(userRepo.size()).toBe(3);
    });

    it("each register call creates a refresh token", async () => {
      const { service, tokenRepo } = makeService();
      await service.register(validRegister);
      expect(tokenRepo.size()).toBe(1);
    });

    it("issues unique refresh tokens per registration", async () => {
      const { service } = makeService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      expect(r1.tokens.refreshToken).not.toBe(r2.tokens.refreshToken);
    });

    it("issues unique access tokens per registration", async () => {
      const { service } = makeService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      expect(r1.tokens.accessToken).not.toBe(r2.tokens.accessToken);
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────────

  describe("login", () => {
    it("returns user and tokens on success", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { user, tokens } = await service.login(validLogin);
      expect(user.email).toBe("nova@universe.io");
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    it("throws InvalidCredentialsError for wrong password", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      await expect(
        service.login({ email: "nova@universe.io", password: "wrongpassword" })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it("throws InvalidCredentialsError for unknown email", async () => {
      const { service } = makeService();
      await expect(
        service.login({ email: "ghost@universe.io", password: "password123" })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it("throws AuthValidationError for invalid email format", async () => {
      const { service } = makeService();
      await expect(
        service.login({ email: "not-an-email", password: "password123" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws AuthValidationError for empty password", async () => {
      const { service } = makeService();
      await expect(
        service.login({ email: "nova@universe.io", password: "" })
      ).rejects.toThrow(AuthValidationError);
    });

    it("login is case-insensitive for email", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { user } = await service.login({ email: "NOVA@UNIVERSE.IO", password: "password123" });
      expect(user.email).toBe("nova@universe.io");
    });

    it("each login issues a new refresh token", async () => {
      const { service, tokenRepo } = makeService();
      await service.register(validRegister);
      await service.login(validLogin);
      await service.login(validLogin);
      // 1 from register + 2 from logins = 3
      expect(tokenRepo.size()).toBe(3);
    });

    it("login does not match wrong user's password", async () => {
      const { service } = makeService();
      await service.register({ email: "a@u.io", username: "user_a", password: "password_a" });
      await service.register({ email: "b@u.io", username: "user_b", password: "password_b" });
      await expect(
        service.login({ email: "a@u.io", password: "password_b" })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it("returns expiresIn of 900 seconds (15 min)", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      expect(tokens.expiresIn).toBe(900);
    });
  });

  // ─── JWT Validation ────────────────────────────────────────────────────────

  describe("validateAccessToken", () => {
    it("validates a freshly issued access token", async () => {
      const { service } = makeService();
      const { tokens, user } = await service.register(validRegister);
      const payload = service.validateAccessToken(tokens.accessToken);
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.username).toBe(user.username);
    });

    it("throws InvalidTokenError for tampered token", () => {
      const { service } = makeService();
      expect(() =>
        service.validateAccessToken("invalid.jwt.token")
      ).toThrow(InvalidTokenError);
    });

    it("throws InvalidTokenError for empty string", () => {
      const { service } = makeService();
      expect(() => service.validateAccessToken("")).toThrow(InvalidTokenError);
    });

    it("throws InvalidTokenError for random string", () => {
      const { service } = makeService();
      expect(() =>
        service.validateAccessToken("totally.not.valid")
      ).toThrow(InvalidTokenError);
    });

    it("payload contains userId matching the registered user", async () => {
      const { service } = makeService();
      const { user, tokens } = await service.register(validRegister);
      const payload = service.validateAccessToken(tokens.accessToken);
      expect(payload.userId).toBe(user.id);
    });

    it("tokens from different users have different payloads", async () => {
      const { service } = makeService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      const p1 = service.validateAccessToken(r1.tokens.accessToken);
      const p2 = service.validateAccessToken(r2.tokens.accessToken);
      expect(p1.userId).not.toBe(p2.userId);
    });
  });

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  describe("refreshAccessToken", () => {
    it("returns new tokens on valid refresh token", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      const newTokens = await service.refreshAccessToken({ refreshToken: tokens.refreshToken });
      expect(newTokens.accessToken).toBeTruthy();
      expect(newTokens.refreshToken).toBeTruthy();
    });

    it("new access token differs from old one", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      const newTokens = await service.refreshAccessToken({ refreshToken: tokens.refreshToken });
      expect(newTokens.accessToken).not.toBe(tokens.accessToken);
    });

    it("new refresh token differs from old one (rotation)", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      const newTokens = await service.refreshAccessToken({ refreshToken: tokens.refreshToken });
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
    });

    it("old refresh token is revoked after rotation", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      await service.refreshAccessToken({ refreshToken: tokens.refreshToken });
      await expect(
        service.refreshAccessToken({ refreshToken: tokens.refreshToken })
      ).rejects.toThrow(TokenRevokedError);
    });

    it("new refresh token is usable", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      const round2 = await service.refreshAccessToken({ refreshToken: tokens.refreshToken });
      const round3 = await service.refreshAccessToken({ refreshToken: round2.refreshToken });
      expect(round3.accessToken).toBeTruthy();
    });

    it("throws InvalidTokenError for unknown refresh token", async () => {
      const { service } = makeService();
      await expect(
        service.refreshAccessToken({ refreshToken: "nonexistent-token" })
      ).rejects.toThrow(InvalidTokenError);
    });

    it("throws TokenRevokedError for explicitly revoked token", async () => {
      const { service, tokenRepo } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      // Manually revoke via repo
      const stored = await tokenRepo.findByTokenHash(
        require("node:crypto").createHash("sha256").update(tokens.refreshToken).digest("hex")
      );
      if (stored) await tokenRepo.revoke(stored.id);
      await expect(
        service.refreshAccessToken({ refreshToken: tokens.refreshToken })
      ).rejects.toThrow(TokenRevokedError);
    });

    it("throws AuthValidationError for missing refreshToken field", async () => {
      const { service } = makeService();
      await expect(
        service.refreshAccessToken({})
      ).rejects.toThrow(AuthValidationError);
    });

    it("throws TokenExpiredError for expired refresh token", async () => {
      const { service, tokenRepo } = makeService();
      const { user } = await service.register(validRegister);
      // Create a token that is already expired
      const { createHash } = await import("node:crypto");
      const rawToken = "fake-expired-token";
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      await tokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // already expired
      });
      await expect(
        service.refreshAccessToken({ refreshToken: rawToken })
      ).rejects.toThrow(TokenExpiredError);
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────────

  describe("logout", () => {
    it("revokes the refresh token on logout", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      await service.logout({ refreshToken: tokens.refreshToken });
      await expect(
        service.refreshAccessToken({ refreshToken: tokens.refreshToken })
      ).rejects.toThrow(TokenRevokedError);
    });

    it("logout is idempotent — does not throw for unknown token", async () => {
      const { service } = makeService();
      await expect(
        service.logout({ refreshToken: "nonexistent-token" })
      ).resolves.toBeUndefined();
    });

    it("logout a second time does not throw", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      await service.logout({ refreshToken: tokens.refreshToken });
      await expect(
        service.logout({ refreshToken: tokens.refreshToken })
      ).resolves.toBeUndefined();
    });

    it("throws AuthValidationError for missing refreshToken", async () => {
      const { service } = makeService();
      await expect(
        service.logout({})
      ).rejects.toThrow(AuthValidationError);
    });

    it("logout only revokes the specified token, not others", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const login1 = await service.login(validLogin);
      const login2 = await service.login(validLogin);
      await service.logout({ refreshToken: login1.tokens.refreshToken });
      // login2 token should still work
      const newTokens = await service.refreshAccessToken({ refreshToken: login2.tokens.refreshToken });
      expect(newTokens.accessToken).toBeTruthy();
    });
  });

  // ─── getCurrentUser ────────────────────────────────────────────────────────

  describe("getCurrentUser", () => {
    it("returns user from a valid access token", async () => {
      const { service } = makeService();
      const { user, tokens } = await service.register(validRegister);
      const current = await service.getCurrentUser(tokens.accessToken);
      expect(current.id).toBe(user.id);
      expect(current.email).toBe(user.email);
    });

    it("throws InvalidTokenError for garbage token", async () => {
      const { service } = makeService();
      await expect(
        service.getCurrentUser("garbage")
      ).rejects.toThrow(InvalidTokenError);
    });

    it("returns updated user data", async () => {
      const { service } = makeService();
      const { tokens } = await service.register(validRegister);
      const current = await service.getCurrentUser(tokens.accessToken);
      expect(current.username).toBe("nova_star");
    });

    it("access token from login also works for getCurrentUser", async () => {
      const { service } = makeService();
      await service.register(validRegister);
      const { tokens } = await service.login(validLogin);
      const current = await service.getCurrentUser(tokens.accessToken);
      expect(current.email).toBe("nova@universe.io");
    });
  });

  // ─── Multi-user Isolation ──────────────────────────────────────────────────

  describe("multi-user isolation", () => {
    it("user A cannot use user B's refresh token", async () => {
      const { service } = makeService();
      await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      const loginB = await service.login({ email: "b@u.io", password: "password123" });
      // B's token is valid, but it points to B's userId — not A's
      const newTokens = await service.refreshAccessToken({ refreshToken: loginB.tokens.refreshToken });
      const payload = service.validateAccessToken(newTokens.accessToken);
      expect(payload.email).toBe("b@u.io");
    });

    it("10 users register independently with separate tokens", async () => {
      const { service, userRepo, tokenRepo } = makeService();
      for (let i = 0; i < 10; i++) {
        await service.register({
          email: `user${i}@u.io`,
          username: `universe_user${i}`,
          password: "password123",
        });
      }
      expect(userRepo.size()).toBe(10);
      expect(tokenRepo.size()).toBe(10);
    });

    it("each user's access token is unique", async () => {
      const { service } = makeService();
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        const { tokens: t } = await service.register({
          email: `user${i}@u.io`,
          username: `user${i}_name`,
          password: "password123",
        });
        tokens.push(t.accessToken);
      }
      const unique = new Set(tokens);
      expect(unique.size).toBe(5);
    });

    it("user A access token cannot decode to user B's userId", async () => {
      const { service } = makeService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      const p1 = service.validateAccessToken(r1.tokens.accessToken);
      const p2 = service.validateAccessToken(r2.tokens.accessToken);
      expect(p1.userId).not.toBe(p2.userId);
      expect(p1.email).not.toBe(p2.email);
    });

    it("revoking all tokens for user A does not affect user B", async () => {
      const { service, tokenRepo } = makeService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      await tokenRepo.revokeAllForUser(r1.user.id);
      // B's token should still work
      const newTokens = await service.refreshAccessToken({ refreshToken: r2.tokens.refreshToken });
      expect(newTokens.accessToken).toBeTruthy();
    });
  });

  // ─── Ecosystem Integration ─────────────────────────────────────────────────

  describe("auto-create profile integration", () => {
    it("auto-creates a profile on register", async () => {
      const { service, profileRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      // Wait briefly for fire-and-forget
      await new Promise((r) => setTimeout(r, 50));
      const profile = await profileRepo.findByUserId(user.id);
      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe(user.id);
    });

    it("profile username matches register username", async () => {
      const { service, profileRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const profile = await profileRepo.findByUserId(user.id);
      expect(profile?.username).toBe("nova_star");
    });

    it("auto-creates avatar on register", async () => {
      const { service, avatarRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const avatar = await avatarRepo.findByUserId(user.id);
      expect(avatar).not.toBeNull();
    });

    it("auto-records account created activity", async () => {
      const { service, activityRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const activities = await activityRepo.getByUserId(user.id);
      const found = activities.find((a) => a.title === "Account Created");
      expect(found).toBeTruthy();
    });

    it("auto-sends welcome notification", async () => {
      const { service, notificationRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const notifications = await notificationRepo.findByUser(user.id);
      const welcome = notifications.find((n) => n.title === "Welcome to Universe");
      expect(welcome).toBeTruthy();
    });

    it("welcome notification is HIGH priority", async () => {
      const { service, notificationRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const notifications = await notificationRepo.findByUser(user.id);
      const welcome = notifications.find((n) => n.title === "Welcome to Universe");
      expect(welcome?.priority).toBe("HIGH");
    });

    it("ecosystem bootstrap failure does not fail registration", async () => {
      const { userRepo, tokenRepo } = makeService();
      const badProfileService = {
        createProfile: async () => { throw new Error("DB down"); },
      } as never;
      const svc = new AuthService(userRepo, tokenRepo, {
        profileService: badProfileService,
      });
      const result = await svc.register(validRegister);
      expect(result.user.id).toBeTruthy();
    });
  });

  // ─── Activity Integration ──────────────────────────────────────────────────

  describe("activity integration", () => {
    it("activity sourceApp is universe-account", async () => {
      const { service, activityRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const activities = await activityRepo.getByUserId(user.id);
      const acct = activities.find((a) => a.title === "Account Created");
      expect(acct?.sourceApp).toBe("universe-account");
    });

    it("activity type is ACCOUNT", async () => {
      const { service, activityRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const activities = await activityRepo.getByUserId(user.id);
      const acct = activities.find((a) => a.title === "Account Created");
      expect(acct?.type).toBe("ACCOUNT");
    });

    it("separate activities per user", async () => {
      const { service, activityRepo } = makeFullService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      await new Promise((r) => setTimeout(r, 50));
      const a1 = await activityRepo.getByUserId(r1.user.id);
      const a2 = await activityRepo.getByUserId(r2.user.id);
      const found1 = a1.find((a) => a.title === "Account Created");
      const found2 = a2.find((a) => a.title === "Account Created");
      expect(found1?.userId).toBe(r1.user.id);
      expect(found2?.userId).toBe(r2.user.id);
    });
  });

  // ─── Notification Integration ──────────────────────────────────────────────

  describe("notification integration", () => {
    it("welcome notification sourceApp is universe-account", async () => {
      const { service, notificationRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const notifications = await notificationRepo.findByUser(user.id);
      const welcome = notifications.find((n) => n.title === "Welcome to Universe");
      expect(welcome?.sourceApp).toBe("universe-account");
    });

    it("welcome notification type is ACCOUNT", async () => {
      const { service, notificationRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const notifications = await notificationRepo.findByUser(user.id);
      const welcome = notifications.find((n) => n.title === "Welcome to Universe");
      expect(welcome?.type).toBe("ACCOUNT");
    });

    it("welcome notification starts as UNREAD", async () => {
      const { service, notificationRepo } = makeFullService();
      const { user } = await service.register(validRegister);
      await new Promise((r) => setTimeout(r, 50));
      const notifications = await notificationRepo.findByUser(user.id);
      const welcome = notifications.find((n) => n.title === "Welcome to Universe");
      expect(welcome?.status).toBe("UNREAD");
    });

    it("each user gets their own welcome notification", async () => {
      const { service, notificationRepo } = makeFullService();
      const r1 = await service.register({ email: "a@u.io", username: "user_a", password: "password123" });
      const r2 = await service.register({ email: "b@u.io", username: "user_b", password: "password123" });
      await new Promise((r) => setTimeout(r, 50));
      const n1 = await notificationRepo.findByUser(r1.user.id);
      const n2 = await notificationRepo.findByUser(r2.user.id);
      expect(n1.find((n) => n.title === "Welcome to Universe")).toBeTruthy();
      expect(n2.find((n) => n.title === "Welcome to Universe")).toBeTruthy();
    });
  });

  // ─── InMemoryUserRepository ────────────────────────────────────────────────

  describe("InMemoryUserRepository", () => {
    let repo: InMemoryUserRepository;
    beforeEach(() => { repo = new InMemoryUserRepository(); });

    it("findById returns null for unknown id", async () => {
      expect(await repo.findById("unknown")).toBeNull();
    });

    it("findByEmail returns null for unknown email", async () => {
      expect(await repo.findByEmail("ghost@u.io")).toBeNull();
    });

    it("findByUsername returns null for unknown username", async () => {
      expect(await repo.findByUsername("ghost")).toBeNull();
    });

    it("create and findById", async () => {
      const user = await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.findById(user.id)).toMatchObject({ email: "a@u.io" });
    });

    it("create and findByEmail", async () => {
      const user = await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.findByEmail("a@u.io")).toMatchObject({ id: user.id });
    });

    it("create and findByUsername", async () => {
      const user = await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.findByUsername("user_a")).toMatchObject({ id: user.id });
    });

    it("existsByEmail returns true after create", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.existsByEmail("a@u.io")).toBe(true);
    });

    it("existsByEmail is case-insensitive", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.existsByEmail("A@U.IO")).toBe(true);
    });

    it("existsByUsername returns true after create", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.existsByUsername("user_a")).toBe(true);
    });

    it("existsByUsername is case-insensitive", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      expect(await repo.existsByUsername("USER_A")).toBe(true);
    });

    it("size returns correct count", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      await repo.create({ email: "b@u.io", username: "user_b", passwordHash: "hash" });
      expect(repo.size()).toBe(2);
    });

    it("clear empties the store", async () => {
      await repo.create({ email: "a@u.io", username: "user_a", passwordHash: "hash" });
      repo.clear();
      expect(repo.size()).toBe(0);
    });
  });

  // ─── InMemoryRefreshTokenRepository ───────────────────────────────────────

  describe("InMemoryRefreshTokenRepository", () => {
    let repo: InMemoryRefreshTokenRepository;
    beforeEach(() => { repo = new InMemoryRefreshTokenRepository(); });

    it("create stores a token", async () => {
      const t = await repo.create({ userId: "u1", tokenHash: "hash1", expiresAt: new Date(Date.now() + 1000) });
      expect(t.id).toBeTruthy();
      expect(t.revokedAt).toBeNull();
    });

    it("findByTokenHash returns stored token", async () => {
      await repo.create({ userId: "u1", tokenHash: "hash1", expiresAt: new Date(Date.now() + 1000) });
      const found = await repo.findByTokenHash("hash1");
      expect(found).not.toBeNull();
      expect(found?.userId).toBe("u1");
    });

    it("findByTokenHash returns null for unknown hash", async () => {
      expect(await repo.findByTokenHash("unknown")).toBeNull();
    });

    it("revoke sets revokedAt", async () => {
      const t = await repo.create({ userId: "u1", tokenHash: "hash1", expiresAt: new Date(Date.now() + 1000) });
      await repo.revoke(t.id);
      const found = await repo.findByTokenHash("hash1");
      expect(found?.revokedAt).not.toBeNull();
    });

    it("revokeAllForUser revokes all user tokens", async () => {
      await repo.create({ userId: "u1", tokenHash: "hash1", expiresAt: new Date(Date.now() + 1000) });
      await repo.create({ userId: "u1", tokenHash: "hash2", expiresAt: new Date(Date.now() + 1000) });
      await repo.create({ userId: "u2", tokenHash: "hash3", expiresAt: new Date(Date.now() + 1000) });
      await repo.revokeAllForUser("u1");
      expect((await repo.findByTokenHash("hash1"))?.revokedAt).not.toBeNull();
      expect((await repo.findByTokenHash("hash2"))?.revokedAt).not.toBeNull();
      expect((await repo.findByTokenHash("hash3"))?.revokedAt).toBeNull();
    });

    it("deleteExpired removes expired tokens", async () => {
      await repo.create({ userId: "u1", tokenHash: "expired", expiresAt: new Date(Date.now() - 1000) });
      await repo.create({ userId: "u1", tokenHash: "valid", expiresAt: new Date(Date.now() + 1000) });
      await repo.deleteExpired();
      expect(await repo.findByTokenHash("expired")).toBeNull();
      expect(await repo.findByTokenHash("valid")).not.toBeNull();
    });

    it("size returns correct count", async () => {
      await repo.create({ userId: "u1", tokenHash: "h1", expiresAt: new Date(Date.now() + 1000) });
      await repo.create({ userId: "u1", tokenHash: "h2", expiresAt: new Date(Date.now() + 1000) });
      expect(repo.size()).toBe(2);
    });

    it("clear empties the store", async () => {
      await repo.create({ userId: "u1", tokenHash: "h1", expiresAt: new Date(Date.now() + 1000) });
      repo.clear();
      expect(repo.size()).toBe(0);
    });
  });
});

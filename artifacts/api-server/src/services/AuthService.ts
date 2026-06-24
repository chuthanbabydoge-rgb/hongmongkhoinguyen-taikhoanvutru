import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { ZodError } from "zod";
import type { IUserRepository } from "../repositories/IUserRepository";
import type { IRefreshTokenRepository } from "../repositories/IRefreshTokenRepository";
import type {
  User,
  AuthTokens,
  JwtPayload,
  RegisterRequest,
  LoginRequest,
} from "../models/auth";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  LogoutRequestSchema,
} from "../models/auth";
import type { ProfileService } from "./ProfileService";
import type { AvatarService } from "./AvatarService";
import type { ReputationService } from "./ReputationService";
import type { UserSettingsService } from "./UserSettingsService";
import type { ActivityService } from "./ActivityService";
import type { NotificationService } from "./NotificationService";

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const JWT_SECRET = process.env["JWT_SECRET"] ?? "universe-dev-secret-change-in-production";

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthValidationError";
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "DuplicateEmailError";
  }
}

export class DuplicateUsernameError extends Error {
  constructor(username: string) {
    super(`Username already taken: ${username}`);
    this.name = "DuplicateUsernameError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidTokenError extends Error {
  constructor(message = "Invalid or expired token") {
    super(message);
    this.name = "InvalidTokenError";
  }
}

export class TokenRevokedError extends Error {
  constructor() {
    super("Refresh token has been revoked");
    this.name = "TokenRevokedError";
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super("Refresh token has expired");
    this.name = "TokenExpiredError";
  }
}

// ─── Dependency Bag ───────────────────────────────────────────────────────────

export interface AuthServiceDeps {
  profileService?: ProfileService;
  avatarService?: AvatarService;
  reputationService?: ReputationService;
  userSettingsService?: UserSettingsService;
  activityService?: ActivityService;
  notificationService?: NotificationService;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly deps: AuthServiceDeps = {},
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(raw: unknown): Promise<{ user: User; tokens: AuthTokens }> {
    let input: RegisterRequest;
    try {
      input = RegisterRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AuthValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    if (await this.userRepo.existsByEmail(input.email)) {
      throw new DuplicateEmailError(input.email);
    }
    if (await this.userRepo.existsByUsername(input.username)) {
      throw new DuplicateUsernameError(input.username);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.userRepo.create({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      passwordHash,
    });

    const tokens = await this._issueTokens(user);

    // Fire-and-forget ecosystem bootstrapping — never fails the registration
    void this._bootstrapEcosystem(user, input.username);

    return { user, tokens };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(raw: unknown): Promise<{ user: User; tokens: AuthTokens }> {
    let input: LoginRequest;
    try {
      input = LoginRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AuthValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) throw new InvalidCredentialsError();

    const tokens = await this._issueTokens(user);
    return { user, tokens };
  }

  // ─── Refresh Access Token ─────────────────────────────────────────────────

  async refreshAccessToken(raw: unknown): Promise<AuthTokens> {
    let parsed: { refreshToken: string };
    try {
      parsed = RefreshRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AuthValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const tokenHash = this._hashToken(parsed.refreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (!stored) throw new InvalidTokenError();
    if (stored.revokedAt) throw new TokenRevokedError();
    if (stored.expiresAt < new Date()) throw new TokenExpiredError();

    // Rotate: revoke old, issue new
    await this.refreshTokenRepo.revoke(stored.id);

    const user = await this.userRepo.findById(stored.userId);
    if (!user) throw new InvalidTokenError("User no longer exists");

    return this._issueTokens(user);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(raw: unknown): Promise<void> {
    let parsed: { refreshToken: string };
    try {
      parsed = LogoutRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AuthValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }

    const tokenHash = this._hashToken(parsed.refreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
    // Silently succeed even if token not found — idempotent logout
  }

  // ─── Validate Access Token ────────────────────────────────────────────────

  validateAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return payload;
    } catch {
      throw new InvalidTokenError();
    }
  }

  // ─── Get Current User ─────────────────────────────────────────────────────

  async getCurrentUser(token: string): Promise<User> {
    const payload = this.validateAccessToken(token);
    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new InvalidTokenError("User no longer exists");
    return user;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async _issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(
      { ...payload, jti: randomBytes(8).toString("hex") },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    const rawRefreshToken = randomBytes(64).toString("hex");
    const tokenHash = this._hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private _hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async _bootstrapEcosystem(user: User, username: string): Promise<void> {
    try {
      const { profileService, avatarService, reputationService, userSettingsService, activityService, notificationService } = this.deps;

      if (profileService) {
        await profileService.createProfile(user.id, username).catch(() => {});
      }
      if (avatarService) {
        await avatarService.getOrCreateAvatar(user.id).catch(() => {});
      }
      if (reputationService) {
        await reputationService.getMyReputation(user.id).catch(() => {});
      }
      if (userSettingsService) {
        await userSettingsService.getMySettings(user.id).catch(() => {});
      }
      if (activityService) {
        await activityService.record({
          userId: user.id,
          type: "ACCOUNT",
          sourceApp: "universe-account",
          title: "Account Created",
          description: `Welcome to Universe, ${username}!`,
        }).catch(() => {});
      }
      if (notificationService) {
        await notificationService.send({
          userId: user.id,
          type: "ACCOUNT",
          title: "Welcome to Universe",
          message: `Your account has been created. Welcome, ${username}!`,
          sourceApp: "universe-account",
          priority: "HIGH",
        }).catch(() => {});
      }
    } catch {
      // Fire-and-forget: ecosystem bootstrap never breaks registration
    }
  }
}

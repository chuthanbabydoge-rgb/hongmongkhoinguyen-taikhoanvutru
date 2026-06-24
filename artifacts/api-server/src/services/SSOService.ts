import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { IApplicationRepository } from "../repositories/IApplicationRepository";
import type { ProfileService } from "./ProfileService";
import type { AvatarService } from "./AvatarService";
import type { IdentityService } from "./IdentityService";
import type { SessionService } from "./SessionService";
import type {
  Application,
  AccessToken,
  Permission,
  VerifyTokenResponse,
} from "../models/application";
import {
  CreateApplicationRequestSchema,
  GenerateTokenRequestSchema,
  VerifyTokenRequestSchema,
  RevokeTokenRequestSchema,
} from "../models/application";

// ─── Error classes ─────────────────────────────────────────────────────────────

export class ApplicationNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Application not found: ${identifier}`);
    this.name = "ApplicationNotFoundError";
  }
}

export class InvalidClientError extends Error {
  constructor(message = "Invalid clientId or clientSecret") {
    super(message);
    this.name = "InvalidClientError";
  }
}

export class InvalidTokenError extends Error {
  constructor(message = "Invalid, expired, or revoked token") {
    super(message);
    this.name = "InvalidTokenError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export class SSOValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSOValidationError";
  }
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`Application with slug "${slug}" already exists`);
    this.name = "DuplicateSlugError";
  }
}

// ─── Token lifetime ────────────────────────────────────────────────────────────

const TOKEN_LIFETIME_DAYS = 30;

function expiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TOKEN_LIFETIME_DAYS);
  return d;
}

function generateToken(): string {
  return `sso_${randomUUID().replace(/-/g, "")}_${Date.now()}`;
}

function generateClientId(): string {
  return `cid_${randomUUID().replace(/-/g, "")}`;
}

function generateClientSecret(): string {
  return `csk_${randomUUID().replace(/-/g, "")}_${randomUUID().replace(/-/g, "")}`;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class SSOService {
  constructor(
    private readonly repo: IApplicationRepository,
    private readonly profileService: ProfileService,
    private readonly avatarService: AvatarService,
    private readonly identityService: IdentityService,
    private readonly sessionService?: SessionService,
  ) {}

  /**
   * Register a new application in the Universe SSO ecosystem.
   * Auto-generates clientId and clientSecret.
   * Rejects duplicate slugs.
   */
  async registerApplication(
    name: string,
    slug: string,
    permissions: Permission[],
  ): Promise<Application> {
    this.validate(CreateApplicationRequestSchema, { name, slug, permissions });

    const existing = await this.repo.findBySlug(slug);
    if (existing) throw new DuplicateSlugError(slug);

    return this.repo.createApplication({
      name,
      slug,
      clientId:     generateClientId(),
      clientSecret: generateClientSecret(),
      permissions,
      isActive: true,
    });
  }

  /**
   * Generate a 30-day access token for a user on behalf of an application.
   * Validates clientId, clientSecret, and that the application is active.
   */
  async generateAccessToken(
    userId: string,
    clientId: string,
    clientSecret: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    this.validate(GenerateTokenRequestSchema, { userId, clientId, clientSecret });

    const app = await this.repo.findByClientId(clientId);
    if (!app) throw new InvalidClientError();
    if (app.clientSecret !== clientSecret) throw new InvalidClientError();
    if (!app.isActive) throw new InvalidClientError("Application is inactive");

    const token = generateToken();
    const exp = expiresAt();

    const savedToken = await this.repo.saveToken({
      userId,
      applicationId: app.id,
      token,
      expiresAt: exp,
    });

    // Sprint 9 — record session when token is generated
    if (this.sessionService) {
      await this.sessionService.createSession({
        userId,
        applicationId: app.id,
        fingerprint:   `auto-${app.id}`,
        accessTokenId: savedToken.id,
        expiresAt:     exp,
      }).catch(() => { /* non-fatal */ });
    }

    return { token, expiresAt: exp };
  }

  /**
   * Verify a token and return user identity + permissions.
   * Checks: token exists, not expired, application still active.
   * Uses ProfileService and IdentityService for real data.
   */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    this.validate(VerifyTokenRequestSchema, { token });

    const record = await this.repo.findToken(token);
    if (!record) throw new InvalidTokenError();

    if (record.expiresAt < new Date()) throw new InvalidTokenError("Token has expired");

    const app = await this.repo.findById(record.applicationId);
    if (!app || !app.isActive) throw new InvalidTokenError("Application is inactive");

    const profile = await this.profileService.getMyProfile(record.userId).catch(() => null);

    let displayName = "Unknown";
    let avatarUrl: string | null = null;
    let universeId = "";

    if (profile) {
      displayName = profile.displayName ?? profile.username ?? "Unknown";
      avatarUrl   = profile.avatarUrl ?? null;
      universeId  = profile.universeId;
    }

    // Sprint 9 — touch session on successful verify
    if (this.sessionService) {
      const sessions = await this.sessionService.getMySessions(record.userId).catch(() => []);
      const match = sessions.find((s) => s.applicationId === record.applicationId);
      if (match) {
        await this.sessionService.touchSession(match.id).catch(() => { /* non-fatal */ });
      }
    }

    return {
      userId:      record.userId,
      universeId,
      displayName,
      avatarUrl,
      permissions: app.permissions,
    };
  }

  /**
   * Revoke an access token immediately.
   * Silently ignores already-revoked tokens.
   */
  async revokeToken(token: string): Promise<void> {
    this.validate(RevokeTokenRequestSchema, { token });

    // Sprint 9 — revoke session before deleting the token record
    if (this.sessionService) {
      const record = await this.repo.findToken(token).catch(() => null);
      if (record) {
        await this.sessionService.revokeSessionByToken(record.userId, record.id).catch(() => { /* non-fatal */ });
      }
    }

    await this.repo.revokeToken(token);
  }

  /** List all registered applications. */
  async getApplications(): Promise<Application[]> {
    return this.repo.getAllApplications();
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private validate(schema: { parse(v: unknown): unknown }, data: unknown): void {
    try {
      schema.parse(data);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new SSOValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }
  }
}

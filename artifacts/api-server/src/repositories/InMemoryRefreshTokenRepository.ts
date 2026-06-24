import { randomUUID } from "node:crypto";
import type { RefreshToken } from "../models/auth";
import type { CreateRefreshTokenInput, IRefreshTokenRepository } from "./IRefreshTokenRepository";

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private store: Map<string, RefreshToken> = new Map();

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const token: RefreshToken = {
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.store.set(token.id, token);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.store.values()) {
      if (token.tokenHash === tokenHash) return token;
    }
    return null;
  }

  async revoke(id: string): Promise<void> {
    const token = this.store.get(id);
    if (token) {
      this.store.set(id, { ...token, revokedAt: new Date() });
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const [id, token] of this.store.entries()) {
      if (token.userId === userId && !token.revokedAt) {
        this.store.set(id, { ...token, revokedAt: new Date() });
      }
    }
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();
    for (const [id, token] of this.store.entries()) {
      if (token.expiresAt < now) {
        this.store.delete(id);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

import { eq, lt } from "drizzle-orm";
import type { RefreshToken } from "../models/auth";
import type { CreateRefreshTokenInput, IRefreshTokenRepository } from "./IRefreshTokenRepository";
import { db } from "@workspace/db";
import { refreshTokensTable } from "@workspace/db/schema";

function toModel(row: typeof refreshTokensTable.$inferSelect): RefreshToken {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
  };
}

export class SupabaseRefreshTokenRepository implements IRefreshTokenRepository {
  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const rows = await db
      .insert(refreshTokensTable)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      })
      .returning();
    if (!rows[0]) throw new Error("Insert failed — no row returned");
    return toModel(rows[0]);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const rows = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async revoke(id: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.userId, userId));
  }

  async deleteExpired(): Promise<void> {
    await db
      .delete(refreshTokensTable)
      .where(lt(refreshTokensTable.expiresAt, new Date()));
  }
}

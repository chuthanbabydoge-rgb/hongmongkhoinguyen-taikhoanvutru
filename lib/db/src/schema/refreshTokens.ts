import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokensTable).omit({
  id: true,
  createdAt: true,
});

export const selectRefreshTokenSchema = createSelectSchema(refreshTokensTable);

export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshTokenRow = typeof refreshTokensTable.$inferSelect;

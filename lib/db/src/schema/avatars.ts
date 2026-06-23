import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const avatarsTable = pgTable("avatars", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull(),
  avatarName: text("avatar_name"),
  avatarUrl: text("avatar_url"),
  frame: text("frame"),
  title: text("title"),
  background: text("background"),
  accessories: jsonb("accessories").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertAvatarSchema = createInsertSchema(avatarsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAvatarSchema = createSelectSchema(avatarsTable);

export type InsertAvatar = z.infer<typeof insertAvatarSchema>;
export type AvatarRow = typeof avatarsTable.$inferSelect;

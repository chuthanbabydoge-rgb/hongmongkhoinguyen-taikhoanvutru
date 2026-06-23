import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activitiesTable = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  sourceApp: text("source_app").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  visibility: text("visibility").notNull().default("PUBLIC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
  createdAt: true,
});

export const selectActivitySchema = createSelectSchema(activitiesTable);

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ActivityRow = typeof activitiesTable.$inferSelect;

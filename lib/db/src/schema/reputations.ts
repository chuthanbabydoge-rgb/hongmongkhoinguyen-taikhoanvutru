import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reputationsTable = pgTable("reputations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull(),
  score: integer("score").notNull().default(0),
  level: text("level").notNull().default("CITIZEN"),
  positiveEvents: integer("positive_events").notNull().default(0),
  negativeEvents: integer("negative_events").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const reputationEventsTable = pgTable("reputation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sourceApp: text("source_app").notNull(),
  reason: text("reason").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertReputationSchema = createInsertSchema(reputationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReputationEventSchema = createInsertSchema(reputationEventsTable).omit({
  id: true,
  createdAt: true,
});

export const selectReputationSchema = createSelectSchema(reputationsTable);
export const selectReputationEventSchema = createSelectSchema(reputationEventsTable);

export type ReputationRow = typeof reputationsTable.$inferSelect;
export type ReputationEventRow = typeof reputationEventsTable.$inferSelect;
export type InsertReputation = z.infer<typeof insertReputationSchema>;
export type InsertReputationEvent = z.infer<typeof insertReputationEventSchema>;

import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const devicesTable = pgTable("devices", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull(),
  fingerprint:  text("fingerprint").notNull(),
  deviceName:   text("device_name"),
  platform:     text("platform"),
  browser:      text("browser"),
  lastSeenAt:   timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessionsTable = pgTable("sessions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull(),
  applicationId: uuid("application_id").notNull(),
  deviceId:      uuid("device_id").notNull(),
  accessTokenId: uuid("access_token_id"),
  ipAddress:     text("ip_address"),
  userAgent:     text("user_agent"),
  isActive:      boolean("is_active").default(true).notNull(),
  lastSeenAt:    timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  expiresAt:     timestamp("expires_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow(),
});

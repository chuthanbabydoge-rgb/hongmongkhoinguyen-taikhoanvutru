import { eq, and, asc, desc } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilter,
} from "../models/notification";
import { NotificationStatus, NotificationPriority } from "../models/notification";
import type { INotificationRepository } from "./INotificationRepository";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";

function toModel(row: typeof notificationsTable.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as Notification["type"],
    title: row.title,
    message: row.message,
    icon: row.icon,
    sourceApp: row.sourceApp,
    priority: row.priority as Notification["priority"],
    status: row.status as Notification["status"],
    actionUrl: row.actionUrl,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export class SupabaseNotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationRequest): Promise<Notification> {
    const rows = await db
      .insert(notificationsTable)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        icon: input.icon ?? null,
        sourceApp: input.sourceApp,
        priority: input.priority ?? NotificationPriority.NORMAL,
        status: NotificationStatus.UNREAD,
        actionUrl: input.actionUrl ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();
    return toModel(rows[0]!);
  }

  async findById(id: string): Promise<Notification | null> {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, id))
      .limit(1);
    return rows[0] ? toModel(rows[0]) : null;
  }

  async findByUser(userId: string, filter?: NotificationFilter): Promise<Notification[]> {
    const conditions = [eq(notificationsTable.userId, userId)];
    if (filter?.status) conditions.push(eq(notificationsTable.status, filter.status));
    if (filter?.type) conditions.push(eq(notificationsTable.type, filter.type));
    if (filter?.priority) conditions.push(eq(notificationsTable.priority, filter.priority));

    const order = filter?.sort === "asc"
      ? asc(notificationsTable.createdAt)
      : desc(notificationsTable.createdAt);

    let query = db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(order);

    if (filter?.limit !== undefined) {
      query = query.limit(filter.limit) as typeof query;
    }
    if (filter?.offset !== undefined) {
      query = query.offset(filter.offset) as typeof query;
    }

    const rows = await query;
    return rows.map(toModel);
  }

  async countUnread(userId: string): Promise<number> {
    const result = await db
      .select({ value: drizzleCount() })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.status, NotificationStatus.UNREAD),
        ),
      );
    return result[0]?.value ?? 0;
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const existing = await this.findById(id);
    if (!existing || existing.userId !== userId) return null;
    if (existing.status !== NotificationStatus.UNREAD) return existing;

    const rows = await db
      .update(notificationsTable)
      .set({ status: NotificationStatus.READ, readAt: new Date() })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async markAllRead(userId: string): Promise<number> {
    const rows = await db
      .update(notificationsTable)
      .set({ status: NotificationStatus.READ, readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.status, NotificationStatus.UNREAD),
        ),
      )
      .returning();
    return rows.length;
  }

  async archive(id: string, userId: string): Promise<Notification | null> {
    const existing = await this.findById(id);
    if (!existing || existing.userId !== userId) return null;

    const rows = await db
      .update(notificationsTable)
      .set({ status: NotificationStatus.ARCHIVED })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning();
    return rows[0] ? toModel(rows[0]) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing || existing.userId !== userId) return false;

    await db
      .delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    return true;
  }
}

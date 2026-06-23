import { randomUUID } from "node:crypto";
import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilter,
} from "../models/notification";
import { NotificationStatus, NotificationPriority } from "../models/notification";
import type { INotificationRepository } from "./INotificationRepository";

export class InMemoryNotificationRepository implements INotificationRepository {
  private store: Map<string, Notification> = new Map();

  async create(input: CreateNotificationRequest): Promise<Notification> {
    const now = new Date();
    const record: Notification = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type as Notification["type"],
      title: input.title,
      message: input.message,
      icon: input.icon ?? null,
      sourceApp: input.sourceApp,
      priority: (input.priority ?? NotificationPriority.NORMAL) as Notification["priority"],
      status: NotificationStatus.UNREAD,
      actionUrl: input.actionUrl ?? null,
      metadata: input.metadata ?? null,
      readAt: null,
      createdAt: now,
    };
    this.store.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null;
  }

  async findByUser(userId: string, filter?: NotificationFilter): Promise<Notification[]> {
    let results = Array.from(this.store.values()).filter((n) => n.userId === userId);

    if (filter?.status) results = results.filter((n) => n.status === filter.status);
    if (filter?.type) results = results.filter((n) => n.type === filter.type);
    if (filter?.priority) results = results.filter((n) => n.priority === filter.priority);

    const sort = filter?.sort ?? "desc";
    results.sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return sort === "desc" ? bTime - aTime : aTime - bTime;
    });

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit;
    results = results.slice(offset, limit !== undefined ? offset + limit : undefined);

    return results;
  }

  async countUnread(userId: string): Promise<number> {
    let count = 0;
    for (const n of this.store.values()) {
      if (n.userId === userId && n.status === NotificationStatus.UNREAD) count++;
    }
    return count;
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const n = this.store.get(id);
    if (!n || n.userId !== userId) return null;
    if (n.status !== NotificationStatus.UNREAD) return n;
    const updated: Notification = {
      ...n,
      status: NotificationStatus.READ,
      readAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async markAllRead(userId: string): Promise<number> {
    let count = 0;
    for (const [id, n] of this.store.entries()) {
      if (n.userId === userId && n.status === NotificationStatus.UNREAD) {
        this.store.set(id, { ...n, status: NotificationStatus.READ, readAt: new Date() });
        count++;
      }
    }
    return count;
  }

  async archive(id: string, userId: string): Promise<Notification | null> {
    const n = this.store.get(id);
    if (!n || n.userId !== userId) return null;
    const updated: Notification = { ...n, status: NotificationStatus.ARCHIVED };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const n = this.store.get(id);
    if (!n || n.userId !== userId) return false;
    this.store.delete(id);
    return true;
  }

  clear(): void {
    this.store.clear();
  }
}

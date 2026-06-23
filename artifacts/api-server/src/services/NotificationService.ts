import type { INotificationRepository } from "../repositories/INotificationRepository";
import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilter,
  NotificationCount,
} from "../models/notification";
import { CreateNotificationRequestSchema } from "../models/notification";
import { ZodError } from "zod";

export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notification not found: ${id}`);
    this.name = "NotificationNotFoundError";
  }
}

export class NotificationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationValidationError";
  }
}

export class NotificationForbiddenError extends Error {
  constructor(userId: string, id: string) {
    super(`Forbidden: user ${userId} does not own notification ${id}`);
    this.name = "NotificationForbiddenError";
  }
}

export class NotificationService {
  constructor(private readonly repo: INotificationRepository) {}

  /**
   * Send (create) a new notification.
   * Validates input with Zod.
   * Status defaults to UNREAD, priority defaults to NORMAL.
   */
  async send(raw: unknown): Promise<Notification> {
    let input: CreateNotificationRequest;
    try {
      input = CreateNotificationRequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new NotificationValidationError(err.errors.map((e) => e.message).join("; "));
      }
      throw err;
    }
    return this.repo.create(input);
  }

  /**
   * Get paginated, filtered notifications for a user.
   * Supports: status, type, priority, limit, offset, sort.
   */
  async getMyNotifications(userId: string, filter?: NotificationFilter): Promise<Notification[]> {
    return this.repo.findByUser(userId, filter);
  }

  /** Count of unread notifications for a user. */
  async countUnread(userId: string): Promise<NotificationCount> {
    const unread = await this.repo.countUnread(userId);
    return { unread };
  }

  /**
   * Mark a single notification as read.
   * Idempotent — already-read notifications are returned unchanged.
   * Throws NotificationNotFoundError if the notification does not exist or does not belong to userId.
   */
  async markRead(id: string, userId: string): Promise<Notification> {
    const result = await this.repo.markRead(id, userId);
    if (!result) throw new NotificationNotFoundError(id);
    return result;
  }

  /**
   * Mark all unread notifications as read for a user.
   * Returns the number of notifications updated.
   */
  async markAllRead(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }

  /**
   * Archive a notification (status → ARCHIVED).
   * Throws NotificationNotFoundError if not found or belongs to a different user.
   */
  async archive(id: string, userId: string): Promise<Notification> {
    const result = await this.repo.archive(id, userId);
    if (!result) throw new NotificationNotFoundError(id);
    return result;
  }

  /**
   * Delete a notification permanently.
   * Throws NotificationNotFoundError if not found or belongs to a different user.
   */
  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.repo.delete(id, userId);
    if (!deleted) throw new NotificationNotFoundError(id);
  }
}

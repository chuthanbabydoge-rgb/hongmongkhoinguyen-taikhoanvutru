import type {
  Notification,
  CreateNotificationRequest,
  NotificationFilter,
} from "../models/notification";

export interface INotificationRepository {
  create(input: CreateNotificationRequest): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUser(userId: string, filter?: NotificationFilter): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  archive(id: string, userId: string): Promise<Notification | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

import type { Request, Response } from "express";
import type { NotificationService } from "../services/NotificationService";
import {
  NotificationNotFoundError,
  NotificationValidationError,
} from "../services/NotificationService";
import type { NotificationFilter } from "../models/notification";
import { NotificationType, NotificationPriority, NotificationStatus } from "../models/notification";

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  /** GET /api/notifications */
  getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const filter: NotificationFilter = {};
    const { status, type, priority, limit, offset, sort } = req.query;

    if (status && Object.values(NotificationStatus).includes(status as NotificationStatus))
      filter.status = status as NotificationStatus;
    if (type && Object.values(NotificationType).includes(type as NotificationType))
      filter.type = type as NotificationType;
    if (priority && Object.values(NotificationPriority).includes(priority as NotificationPriority))
      filter.priority = priority as NotificationPriority;
    if (limit) filter.limit = parseInt(limit as string, 10);
    if (offset) filter.offset = parseInt(offset as string, 10);
    if (sort === "asc" || sort === "desc") filter.sort = sort;

    const notifications = await this.service.getMyNotifications(userId, filter);
    res.json({ notifications });
  };

  /** GET /api/notifications/unread-count */
  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const count = await this.service.countUnread(userId);
    res.json(count);
  };

  /** GET /api/notifications/:id */
  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }

    try {
      const notifications = await this.service.getMyNotifications(userId);
      const notification = notifications.find((n) => n.id === id);
      if (!notification) { res.status(404).json({ error: "Notification not found" }); return; }
      res.json({ notification });
    } catch (err) {
      throw err;
    }
  };

  /** POST /api/notifications */
  send = async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = await this.service.send(req.body);
      res.status(201).json({ notification });
    } catch (err) {
      if (err instanceof NotificationValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** PATCH /api/notifications/:id/read */
  markRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    try {
      const notification = await this.service.markRead(id, userId);
      res.json({ notification });
    } catch (err) {
      if (err instanceof NotificationNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** PATCH /api/notifications/read-all */
  markAllRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const updated = await this.service.markAllRead(userId);
    res.json({ updated });
  };

  /** PATCH /api/notifications/:id/archive */
  archive = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    try {
      const notification = await this.service.archive(id, userId);
      res.json({ notification });
    } catch (err) {
      if (err instanceof NotificationNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** DELETE /api/notifications/:id */
  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    try {
      await this.service.delete(id, userId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotificationNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}

import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.notificationController;

/**
 * GET /api/notifications
 * Authenticated user's notifications with optional filters.
 * Query: status, type, priority, limit, offset, sort
 */
router.get("/notifications", authMiddleware, ctrl.getMyNotifications);

/**
 * GET /api/notifications/unread-count
 * Unread count for the authenticated user.
 * Response: { unread: number }
 */
router.get("/notifications/unread-count", authMiddleware, ctrl.getUnreadCount);

/**
 * GET /api/notifications/:id
 * Single notification by id (must belong to authenticated user).
 */
router.get("/notifications/:id", authMiddleware, ctrl.getById);

/**
 * POST /api/notifications
 * Create and deliver a notification.
 * Called by ecosystem apps (Football Universe, Marketplace, World Creator, etc.)
 * Body: { userId, type, title, message, sourceApp, priority?, actionUrl?, metadata? }
 */
router.post("/notifications", ctrl.send);

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications as read for the authenticated user.
 * Response: { updated: number }
 */
router.patch("/notifications/read-all", authMiddleware, ctrl.markAllRead);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch("/notifications/:id/read", authMiddleware, ctrl.markRead);

/**
 * PATCH /api/notifications/:id/archive
 * Archive a notification (status → ARCHIVED).
 */
router.patch("/notifications/:id/archive", authMiddleware, ctrl.archive);

/**
 * DELETE /api/notifications/:id
 * Permanently delete a notification.
 */
router.delete("/notifications/:id", authMiddleware, ctrl.delete);

export default router;

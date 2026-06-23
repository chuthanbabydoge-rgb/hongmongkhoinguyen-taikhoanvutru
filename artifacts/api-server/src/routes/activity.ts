import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.activityController;

/**
 * GET /api/activity/me
 * Authenticated user's activity timeline.
 * Query: limit, offset
 */
router.get("/activity/me", authMiddleware, ctrl.handleGetMyActivities);

/**
 * GET /api/activity/feed
 * Global public activity feed (all users, PUBLIC visibility), newest first.
 * Query: limit (default 20), offset (default 0)
 */
router.get("/activity/feed", ctrl.handleGetFeed);

/**
 * GET /api/activity/count
 * Total activity count for the authenticated user.
 */
router.get("/activity/count", authMiddleware, ctrl.handleCountActivities);

/**
 * GET /api/activity/:userId
 * Public activity timeline for any user.
 * Query: limit, offset
 */
router.get("/activity/:userId", ctrl.handleGetActivitiesByUserId);

/**
 * POST /api/activity
 * Create a new activity entry.
 * Called by ecosystem apps (Football Universe, World Creator, etc.)
 * Body: { userId, type, sourceApp, title, description?, metadata?, visibility? }
 */
router.post("/activity", ctrl.handleCreateActivity);

/**
 * DELETE /api/activity/:id
 * Delete an activity by id.
 */
router.delete("/activity/:id", ctrl.handleDeleteActivity);

export default router;

import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.reputationController;

/**
 * GET /api/reputation/me
 * Authenticated user's reputation (score, level, badge, event counts).
 */
router.get("/reputation/me", authMiddleware, ctrl.handleGetMyReputation);

/**
 * GET /api/reputation/leaderboard
 * Top users by reputation score. Query: ?limit=N (default 10)
 */
router.get("/reputation/leaderboard", ctrl.handleGetLeaderboard);

/**
 * GET /api/reputation/history
 * Event history for the authenticated user.
 */
router.get("/reputation/history", authMiddleware, ctrl.handleGetHistory);

/**
 * GET /api/reputation/:userId
 * Public reputation for any user by userId.
 */
router.get("/reputation/:userId", ctrl.handleGetReputation);

/**
 * POST /api/reputation/add
 * Add reputation points to a user.
 * Body: { userId, points, sourceApp, reason }
 * Called by ecosystem apps (Football Universe, Marketplace, etc.)
 */
router.post("/reputation/add", ctrl.handleAddReputation);

/**
 * POST /api/reputation/deduct
 * Deduct reputation points from a user.
 * Body: { userId, points, sourceApp, reason }
 */
router.post("/reputation/deduct", ctrl.handleDeductReputation);

export default router;

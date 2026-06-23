import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.avatarController;

/**
 * GET /api/avatar/me
 * Returns avatar of the authenticated user.
 * Auto-creates a default avatar if none exists (201) or returns existing (200).
 * Response: { avatar: Avatar }
 */
router.get("/avatar/me", authMiddleware, ctrl.getMe);

/**
 * PATCH /api/avatar/me
 * Updates avatar fields for the authenticated user.
 * Validation: avatarName <= 50 chars, title <= 50 chars.
 * Response: { avatar: Avatar }
 */
router.patch("/avatar/me", authMiddleware, ctrl.updateMe);

/**
 * POST /api/avatar/reset
 * Resets avatar to default values (frame-none, bg-void, "Universe Citizen").
 * Response: { avatar: Avatar }
 */
router.post("/avatar/reset", authMiddleware, ctrl.reset);

export default router;

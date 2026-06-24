import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.userSettingsController;

/**
 * GET /api/settings/me
 * Returns the authenticated user's settings. Auto-creates with defaults if none exist.
 */
router.get("/settings/me", authMiddleware, ctrl.getMySettings);

/**
 * PATCH /api/settings/me
 * Partial update. Accepts any subset of settings fields.
 */
router.patch("/settings/me", authMiddleware, ctrl.updateMySettings);

/**
 * POST /api/settings/reset
 * Resets all settings to defaults.
 */
router.post("/settings/reset", authMiddleware, ctrl.resetSettings);

export default router;

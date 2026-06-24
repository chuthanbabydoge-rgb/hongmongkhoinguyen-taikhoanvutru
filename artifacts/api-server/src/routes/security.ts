import { Router, type IRouter } from "express";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.sessionController;

/**
 * GET /api/security/sessions
 * List all active sessions for the authenticated user.
 */
router.get("/security/sessions", ctrl.handleGetMySessions);

/**
 * DELETE /api/security/sessions/:id
 * Revoke a specific session.
 */
router.delete("/security/sessions/:id", ctrl.handleRevokeSession);

/**
 * GET /api/security/devices
 * List all devices for the authenticated user.
 */
router.get("/security/devices", ctrl.handleGetMyDevices);

/**
 * DELETE /api/security/devices/:id
 * Remove a device and revoke all its associated sessions.
 */
router.delete("/security/devices/:id", ctrl.handleRevokeDevice);

/**
 * POST /api/security/logout-all
 * Logout from all applications/devices at once.
 */
router.post("/security/logout-all", ctrl.handleLogoutAll);

export default router;

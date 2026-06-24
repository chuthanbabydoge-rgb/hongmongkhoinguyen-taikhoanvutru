import { Router, type IRouter } from "express";
import { container } from "../container";

const router: IRouter = Router();
const ctrl = container.authController;

/**
 * POST /api/auth/register
 * Register a new user. Returns user + tokens.
 * Body: { email, username, password }
 */
router.post("/auth/register", ctrl.register);

/**
 * POST /api/auth/login
 * Authenticate with email + password. Returns user + tokens.
 * Body: { email, password }
 */
router.post("/auth/login", ctrl.login);

/**
 * POST /api/auth/refresh
 * Rotate refresh token, return new access + refresh tokens.
 * Body: { refreshToken }
 */
router.post("/auth/refresh", ctrl.refresh);

/**
 * POST /api/auth/logout
 * Revoke refresh token. Idempotent.
 * Body: { refreshToken }
 */
router.post("/auth/logout", ctrl.logout);

/**
 * GET /api/auth/me
 * Return current user from Bearer access token.
 */
router.get("/auth/me", ctrl.me);

export default router;

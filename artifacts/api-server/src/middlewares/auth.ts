import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../models/auth";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "universe-dev-secret-change-in-production";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      jwtPayload?: JwtPayload;
    }
  }
}

/**
 * JWT Auth middleware — validates a signed JWT access token issued by AuthService.
 *
 * Extracts userId and JwtPayload from a valid Bearer token.
 * Token format: signed JWT with { userId, email, username } payload.
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!payload.userId || typeof payload.userId !== "string") {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.userId = payload.userId;
    req.jwtPayload = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Legacy base64 auth middleware — kept for backward compatibility with
 * the Universe Account frontend mock auth system.
 *
 * Token format: base64(JSON.stringify({ userId: string, exp: number }))
 *
 * HUB: Replace with authenticateJWT once all clients migrate.
 * SUPABASE: Replace with supabase.auth.getUser(token)
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  // Try JWT first (new auth)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (payload.userId && typeof payload.userId === "string") {
      req.userId = payload.userId;
      req.jwtPayload = payload;
      next();
      return;
    }
  } catch {
    // Fall through to legacy base64 parsing
  }

  // Legacy base64 token (mock auth from frontend)
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8")) as {
      userId: string;
      exp: number;
    };

    if (!decoded.userId || typeof decoded.userId !== "string") {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    if (decoded.exp && decoded.exp < Date.now()) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Malformed token" });
  }
}

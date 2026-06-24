import type { Request, Response } from "express";
import type { AuthService } from "../services/AuthService";
import {
  AuthValidationError,
  DuplicateEmailError,
  DuplicateUsernameError,
  InvalidCredentialsError,
  InvalidTokenError,
  TokenRevokedError,
  TokenExpiredError,
} from "../services/AuthService";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, tokens } = await this.service.register(req.body);
      res.status(201).json({
        user: this._safeUser(user),
        tokens,
      });
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      if (err instanceof DuplicateEmailError) {
        res.status(409).json({ error: err.message }); return;
      }
      if (err instanceof DuplicateUsernameError) {
        res.status(409).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, tokens } = await this.service.login(req.body);
      res.json({
        user: this._safeUser(user),
        tokens,
      });
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const tokens = await this.service.refreshAccessToken(req.body);
      res.json({ tokens });
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      if (err instanceof InvalidTokenError) {
        res.status(401).json({ error: err.message }); return;
      }
      if (err instanceof TokenRevokedError) {
        res.status(401).json({ error: err.message }); return;
      }
      if (err instanceof TokenExpiredError) {
        res.status(401).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.logout(req.body);
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" }); return;
    }
    const token = authHeader.slice(7);
    try {
      const user = await this.service.getCurrentUser(token);
      res.json({ user: this._safeUser(user) });
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        res.status(401).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  private _safeUser(user: { id: string; email: string; username: string; emailVerified: boolean; createdAt: Date | null; updatedAt: Date | null }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

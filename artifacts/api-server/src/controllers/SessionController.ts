import type { Request, Response } from "express";
import type { SessionService } from "../services/SessionService";
import { SessionNotFoundError, DeviceNotFoundError, SessionValidationError } from "../services/SessionService";

export class SessionController {
  constructor(private readonly service: SessionService) {}

  /** GET /api/security/sessions */
  handleGetMySessions = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const sessions = await this.service.getMySessions(userId);
    res.json({ sessions });
  };

  /** GET /api/security/devices */
  handleGetMyDevices = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const devices = await this.service.getMyDevices(userId);
    res.json({ devices });
  };

  /** DELETE /api/security/sessions/:id */
  handleRevokeSession = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { id } = req.params;
    try {
      await this.service.revokeSession(id);
      res.json({ revoked: true });
    } catch (err) {
      if (err instanceof SessionNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** DELETE /api/security/devices/:id */
  handleRevokeDevice = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { id } = req.params;
    try {
      await this.service.revokeDevice(userId, id);
      res.json({ revoked: true });
    } catch (err) {
      if (err instanceof DeviceNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** POST /api/security/logout-all */
  handleLogoutAll = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const result = await this.service.logoutAll(userId);
    res.json(result);
  };
}

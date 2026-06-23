import type { Request, Response } from "express";
import type { AvatarService } from "../services/AvatarService";
import {
  AvatarNotFoundError,
  AvatarValidationError,
  AvatarRepositoryError,
} from "../services/AvatarService";

export class AvatarController {
  constructor(private readonly service: AvatarService) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    try {
      const { avatar, created } = await this.service.getOrCreateAvatar(userId);
      res.status(created ? 201 : 200).json({ avatar });
    } catch (err) {
      if (err instanceof AvatarRepositoryError) {
        res.status(503).json({ error: "Service temporarily unavailable" });
        return;
      }
      throw err;
    }
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    try {
      const avatar = await this.service.updateMyAvatar(userId, req.body);
      res.json({ avatar });
    } catch (err) {
      if (err instanceof AvatarNotFoundError) {
        res.status(404).json({ error: "Avatar not found" }); return;
      }
      if (err instanceof AvatarValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      if (err instanceof AvatarRepositoryError) {
        res.status(503).json({ error: "Service temporarily unavailable" }); return;
      }
      throw err;
    }
  };

  reset = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    try {
      const avatar = await this.service.resetMyAvatar(userId);
      res.json({ avatar });
    } catch (err) {
      if (err instanceof AvatarNotFoundError) {
        res.status(404).json({ error: "Avatar not found" }); return;
      }
      if (err instanceof AvatarRepositoryError) {
        res.status(503).json({ error: "Service temporarily unavailable" }); return;
      }
      throw err;
    }
  };
}

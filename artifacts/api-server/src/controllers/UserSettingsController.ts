import type { Request, Response } from "express";
import type { UserSettingsService } from "../services/UserSettingsService";
import { SettingsValidationError } from "../services/UserSettingsService";

export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  getMySettings = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const settings = await this.service.getMySettings(userId);
    res.json({ settings });
  };

  updateMySettings = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const settings = await this.service.updateMySettings(userId, req.body);
      res.json({ settings });
    } catch (err) {
      if (err instanceof SettingsValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  resetSettings = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const settings = await this.service.resetSettings(userId);
    res.json({ settings });
  };
}

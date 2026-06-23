import type { Request, Response } from "express";
import type { ActivityService } from "../services/ActivityService";
import { ActivityNotFoundError, ActivityValidationError } from "../services/ActivityService";

export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  /** GET /api/activity/me */
  handleGetMyActivities = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : undefined;
    const offset = req.query["offset"] ? parseInt(req.query["offset"] as string, 10) : 0;
    const activities = await this.service.getMyActivities(userId, { limit, offset });
    res.json({ activities });
  };

  /** GET /api/activity/feed */
  handleGetFeed = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : 20;
    const offset = req.query["offset"] ? parseInt(req.query["offset"] as string, 10) : 0;
    const activities = await this.service.getFeed(limit, offset);
    res.json({ activities });
  };

  /** GET /api/activity/count */
  handleCountActivities = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const count = await this.service.countActivities(userId);
    res.json({ count });
  };

  /** GET /api/activity/:userId */
  handleGetActivitiesByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params["userId"])
      ? req.params["userId"][0]
      : req.params["userId"];
    if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : undefined;
    const offset = req.query["offset"] ? parseInt(req.query["offset"] as string, 10) : 0;
    const activities = await this.service.getActivitiesByUserId(userId, { limit, offset });
    res.json({ activities });
  };

  /** POST /api/activity */
  handleCreateActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const activity = await this.service.createActivity(req.body);
      res.status(201).json({ activity });
    } catch (err) {
      if (err instanceof ActivityValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** DELETE /api/activity/:id */
  handleDeleteActivity = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    try {
      await this.service.deleteActivity(id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof ActivityNotFoundError) {
        res.status(404).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}

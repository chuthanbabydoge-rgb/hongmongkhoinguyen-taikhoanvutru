import type { Request, Response } from "express";
import type { ReputationService } from "../services/ReputationService";
import { ReputationValidationError } from "../services/ReputationService";
import { getBadgeForLevel } from "../models/reputation";

export class ReputationController {
  constructor(private readonly service: ReputationService) {}

  /** GET /api/reputation/me */
  handleGetMyReputation = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const rep = await this.service.getMyReputation(userId);
    res.json({
      reputation: {
        score: rep.score,
        level: rep.level,
        badge: getBadgeForLevel(rep.level),
        positiveEvents: rep.positiveEvents,
        negativeEvents: rep.negativeEvents,
        lastActivityAt: rep.lastActivityAt,
      },
    });
  };

  /** GET /api/reputation/:userId */
  handleGetReputation = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params["userId"])
      ? req.params["userId"][0]
      : req.params["userId"];
    if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }
    const rep = await this.service.getReputation(userId);
    res.json({
      reputation: {
        userId: rep.userId,
        score: rep.score,
        level: rep.level,
        badge: getBadgeForLevel(rep.level),
        positiveEvents: rep.positiveEvents,
        negativeEvents: rep.negativeEvents,
      },
    });
  };

  /** GET /api/reputation/leaderboard */
  handleGetLeaderboard = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : 10;
    const users = await this.service.getLeaderboard(limit);
    res.json({ users });
  };

  /** GET /api/reputation/history */
  handleGetHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const events = await this.service.getHistory(userId);
    res.json({ events });
  };

  /** POST /api/reputation/add */
  handleAddReputation = async (req: Request, res: Response): Promise<void> => {
    const { userId, points, sourceApp, reason } = req.body as {
      userId?: string; points?: number; sourceApp?: string; reason?: string;
    };
    if (!userId || points === undefined || !sourceApp || !reason) {
      res.status(400).json({ error: "Missing required fields: userId, points, sourceApp, reason" });
      return;
    }
    try {
      const rep = await this.service.addReputation(userId, points, sourceApp, reason);
      res.json({
        reputation: {
          score: rep.score,
          level: rep.level,
          badge: getBadgeForLevel(rep.level),
          positiveEvents: rep.positiveEvents,
        },
      });
    } catch (err) {
      if (err instanceof ReputationValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };

  /** POST /api/reputation/deduct */
  handleDeductReputation = async (req: Request, res: Response): Promise<void> => {
    const { userId, points, sourceApp, reason } = req.body as {
      userId?: string; points?: number; sourceApp?: string; reason?: string;
    };
    if (!userId || points === undefined || !sourceApp || !reason) {
      res.status(400).json({ error: "Missing required fields: userId, points, sourceApp, reason" });
      return;
    }
    try {
      const rep = await this.service.deductReputation(userId, points, sourceApp, reason);
      res.json({
        reputation: {
          score: rep.score,
          level: rep.level,
          badge: getBadgeForLevel(rep.level),
          negativeEvents: rep.negativeEvents,
        },
      });
    } catch (err) {
      if (err instanceof ReputationValidationError) {
        res.status(422).json({ error: err.message }); return;
      }
      throw err;
    }
  };
}

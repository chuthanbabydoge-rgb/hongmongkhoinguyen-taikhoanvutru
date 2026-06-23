import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import avatarRouter from "./avatar";
import identityRouter from "./identity";
import achievementRouter from "./achievement";
import notificationRouter from "./notification";
import reputationRouter from "./reputation";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(avatarRouter);
router.use(identityRouter);
router.use(achievementRouter);
router.use(notificationRouter);
router.use(reputationRouter);
router.use(activityRouter);

export default router;

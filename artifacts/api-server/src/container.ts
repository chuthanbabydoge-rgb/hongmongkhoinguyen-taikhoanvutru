import { SupabaseProfileRepository } from "./repositories/SupabaseProfileRepository";
import { ProfileService } from "./services/ProfileService";
import { ProfileController } from "./controllers/ProfileController";
import { SupabaseAvatarRepository } from "./repositories/SupabaseAvatarRepository";
import { AvatarService } from "./services/AvatarService";
import { AvatarController } from "./controllers/AvatarController";
import { IdentityService } from "./services/IdentityService";
import { IdentityController } from "./controllers/IdentityController";
import { SupabaseAchievementRepository } from "./repositories/SupabaseAchievementRepository";
import { AchievementService } from "./services/AchievementService";
import { AchievementController } from "./controllers/AchievementController";
import { SupabaseNotificationRepository } from "./repositories/SupabaseNotificationRepository";
import { NotificationService } from "./services/NotificationService";
import { NotificationController } from "./controllers/NotificationController";
import { SupabaseReputationRepository } from "./repositories/SupabaseReputationRepository";
import { ReputationService } from "./services/ReputationService";
import { ReputationController } from "./controllers/ReputationController";
import { SupabaseActivityRepository } from "./repositories/SupabaseActivityRepository";
import { ActivityService } from "./services/ActivityService";
import { ActivityController } from "./controllers/ActivityController";
import { SupabaseApplicationRepository } from "./repositories/SupabaseApplicationRepository";
import { SSOService } from "./services/SSOService";
import { SSOController } from "./controllers/SSOController";
import { SupabaseUserSettingsRepository } from "./repositories/SupabaseUserSettingsRepository";
import { UserSettingsService } from "./services/UserSettingsService";
import { UserSettingsController } from "./controllers/UserSettingsController";
import { SupabaseSessionRepository } from "./repositories/SupabaseSessionRepository";
import { SessionService } from "./services/SessionService";
import { SessionController } from "./controllers/SessionController";
import { SupabaseUserRepository } from "./repositories/SupabaseUserRepository";
import { SupabaseRefreshTokenRepository } from "./repositories/SupabaseRefreshTokenRepository";
import { AuthService } from "./services/AuthService";
import { AuthController } from "./controllers/AuthController";

/**
 * Dependency injection container — wires repositories → services → controllers.
 *
 * Dependency order:
 *   activityService  (no deps on other services)
 *   notificationService (+ activityService)
 *   achievementService  (+ activityService)
 *   reputationService   (+ notificationService, activityService)
 *   userSettingsService (+ activityService, notificationService)
 *   authService         (+ profileService, avatarService, reputationService,
 *                          userSettingsService, activityService, notificationService)
 */
function createContainer() {
  const profileRepository = new SupabaseProfileRepository();
  const profileService = new ProfileService(profileRepository);
  const profileController = new ProfileController(profileService);

  const avatarRepository = new SupabaseAvatarRepository();
  const avatarService = new AvatarService(avatarRepository);
  const avatarController = new AvatarController(avatarService);

  const identityService = new IdentityService(profileRepository, avatarRepository);
  const identityController = new IdentityController(identityService);

  // Activity must be wired first — other services depend on it
  const activityRepository = new SupabaseActivityRepository();
  const activityService = new ActivityService(activityRepository);
  const activityController = new ActivityController(activityService);

  const achievementRepository = new SupabaseAchievementRepository();
  const achievementService = new AchievementService(achievementRepository, activityService);
  const achievementController = new AchievementController(achievementService);

  const notificationRepository = new SupabaseNotificationRepository();
  const notificationService = new NotificationService(notificationRepository, activityService);
  const notificationController = new NotificationController(notificationService);

  const reputationRepository = new SupabaseReputationRepository();
  const reputationService = new ReputationService(reputationRepository, notificationService, activityService);
  const reputationController = new ReputationController(reputationService);

  // Sprint 9 — Sessions & Devices (must be wired before SSO)
  const sessionRepository = new SupabaseSessionRepository();
  const sessionService = new SessionService(sessionRepository);
  const sessionController = new SessionController(sessionService);

  // SSO — depends on profileService, avatarService, identityService, sessionService
  const applicationRepository = new SupabaseApplicationRepository();
  const ssoService = new SSOService(applicationRepository, profileService, avatarService, identityService, sessionService);
  const ssoController = new SSOController(ssoService);

  // Sprint 10 — UserSettings
  const userSettingsRepository = new SupabaseUserSettingsRepository();
  const userSettingsService = new UserSettingsService(
    userSettingsRepository,
    activityService,
    notificationService,
  );
  const userSettingsController = new UserSettingsController(userSettingsService);

  // Sprint AUTH-1 — Authentication (wired last; depends on all ecosystem services)
  const userRepository = new SupabaseUserRepository();
  const refreshTokenRepository = new SupabaseRefreshTokenRepository();
  const authService = new AuthService(userRepository, refreshTokenRepository, {
    profileService,
    avatarService,
    reputationService,
    userSettingsService,
    activityService,
    notificationService,
  });
  const authController = new AuthController(authService);

  return {
    profileRepository,
    profileService,
    profileController,
    avatarRepository,
    avatarService,
    avatarController,
    identityService,
    identityController,
    activityRepository,
    activityService,
    activityController,
    achievementRepository,
    achievementService,
    achievementController,
    notificationRepository,
    notificationService,
    notificationController,
    reputationRepository,
    reputationService,
    reputationController,
    sessionRepository,
    sessionService,
    sessionController,
    applicationRepository,
    ssoService,
    ssoController,
    userSettingsRepository,
    userSettingsService,
    userSettingsController,
    userRepository,
    refreshTokenRepository,
    authService,
    authController,
  } as const;
}

export const container = createContainer();

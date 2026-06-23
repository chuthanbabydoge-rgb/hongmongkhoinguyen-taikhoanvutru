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

/**
 * Dependency injection container — wires repositories → services → controllers.
 *
 * To swap implementations (e.g. for testing), replace the repository here.
 * In tests, use InMemory*Repository instead of Supabase*Repository.
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

  const achievementRepository = new SupabaseAchievementRepository();
  const achievementService = new AchievementService(achievementRepository);
  const achievementController = new AchievementController(achievementService);

  const notificationRepository = new SupabaseNotificationRepository();
  const notificationService = new NotificationService(notificationRepository);
  const notificationController = new NotificationController(notificationService);

  const reputationRepository = new SupabaseReputationRepository();
  const reputationService = new ReputationService(reputationRepository, notificationService);
  const reputationController = new ReputationController(reputationService);

  return {
    profileRepository,
    profileService,
    profileController,
    avatarRepository,
    avatarService,
    avatarController,
    identityService,
    identityController,
    achievementRepository,
    achievementService,
    achievementController,
    notificationRepository,
    notificationService,
    notificationController,
    reputationRepository,
    reputationService,
    reputationController,
  } as const;
}

export const container = createContainer();

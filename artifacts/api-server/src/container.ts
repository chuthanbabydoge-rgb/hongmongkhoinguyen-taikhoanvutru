import { SupabaseProfileRepository } from "./repositories/SupabaseProfileRepository";
import { ProfileService } from "./services/ProfileService";
import { ProfileController } from "./controllers/ProfileController";
import { SupabaseAvatarRepository } from "./repositories/SupabaseAvatarRepository";
import { AvatarService } from "./services/AvatarService";
import { AvatarController } from "./controllers/AvatarController";

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

  return {
    profileRepository,
    profileService,
    profileController,
    avatarRepository,
    avatarService,
    avatarController,
  } as const;
}

export const container = createContainer();

import type { UserSettings, UpdateUserSettingsRequest } from "../models/userSettings";

export interface CreateUserSettingsInput {
  userId: string;
  theme?: string;
  language?: string;
  timezone?: string;
  privacyProfile?: string;
  privacyActivity?: string;
  privacyReputation?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketplaceNotifications?: boolean;
  achievementNotifications?: boolean;
  reputationNotifications?: boolean;
  securityNotifications?: boolean;
  allowFriendRequests?: boolean;
  allowDirectMessages?: boolean;
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
}

export interface IUserSettingsRepository {
  create(input: CreateUserSettingsInput): Promise<UserSettings>;
  findByUserId(userId: string): Promise<UserSettings | null>;
  update(userId: string, input: UpdateUserSettingsRequest): Promise<UserSettings | null>;
  delete(userId: string): Promise<boolean>;
  exists(userId: string): Promise<boolean>;
  upsert(userId: string, input?: UpdateUserSettingsRequest): Promise<UserSettings>;
}

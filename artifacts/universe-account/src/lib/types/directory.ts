export type UserSpecialization =
  | "creator"
  | "trader"
  | "breeder"
  | "football_manager"
  | "explorer"
  | "guardian";

export type ReputationRank =
  | "Newcomer"
  | "Explorer"
  | "Pioneer"
  | "Guardian"
  | "Legend"
  | "Cosmic";

export interface DirectoryUser {
  id: string;
  universeId: string;
  username: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  title: string;
  bio: string;
  level: number;
  experience: number;
  experienceToNext: number;
  reputation: number;
  reputationRank: ReputationRank;
  badges: string[];
  verifiedAt: string | null;
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
  specializations: UserSpecialization[];

  // Category-specific scores (for rankings)
  creatorScore: number;     // worlds built × quality
  traderScore: number;      // trades × volume
  breederScore: number;     // breeds × rarity
  footballScore: number;    // win rate × league position

  // Stats
  worldsBuilt: number;
  tradesCompleted: number;
  assetsOwned: number;
  animalsOwned: number;
  rareAnimals: number;
  clubsOwned: number;
  winRate: number;
  leaguePosition: number;
  achievementsUnlocked: number;
  followersCount: number;
}

export type DirectoryFilter =
  | "all"
  | "top_creators"
  | "top_traders"
  | "top_breeders"
  | "top_football_managers";

export type SortOption = "reputation" | "level" | "recent";

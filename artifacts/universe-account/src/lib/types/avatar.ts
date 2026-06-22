export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export interface AvatarFrame {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  preview: {
    ring: string;       // tailwind ring class or custom
    glow: string;       // shadow glow
    animation?: string; // tailwind animate class
    gradient: string;   // border-image gradient for display
  };
  unlockCondition: string;
}

export interface AvatarBackground {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  gradient: string; // CSS gradient string
  particles?: boolean;
  unlockCondition: string;
}

export interface AvatarBadge {
  id: string;
  name: string;
  icon: string;
  rarity: ItemRarity;
  description: string;
  color: string;
  unlockCondition: string;
}

export interface AvatarTitle {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  color: string;
  gradient?: string;
  unlockCondition: string;
}

export interface AvatarTheme {
  id: string;
  name: string;
  icon: string;
  primary: string;
  accent: string;
  bg: string;
  card: string;
  border: string;
  description: string;
}

export interface AvatarPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  frameId: string;
  backgroundId: string;
  badgeId: string;
  titleId: string;
  themeId: string;
}

export interface UserAvatarConfig {
  userId: string;
  displayName: string;
  initials: string;
  level: number;
  reputation: number;
  currentFrameId: string;
  currentBackgroundId: string;
  currentBadgeId: string | null;
  currentTitleId: string;
  currentThemeId: string;
  ownedFrameIds: string[];
  ownedBackgroundIds: string[];
  ownedBadgeIds: string[];
  ownedTitleIds: string[];
  lastUpdated: string;
}

export const RARITY_META: Record<
  ItemRarity,
  { label: string; color: string; bg: string; border: string; glow: string; gradient: string }
> = {
  common: {
    label: "Common",
    color: "text-white/50",
    bg: "bg-white/8",
    border: "border-white/15",
    glow: "",
    gradient: "from-white/20 to-white/5",
  },
  rare: {
    label: "Rare",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]",
    gradient: "from-blue-400/30 to-cyan-500/10",
  },
  epic: {
    label: "Epic",
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_16px_rgba(124,58,237,0.25)]",
    gradient: "from-violet-400/35 to-purple-600/15",
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_22px_rgba(245,158,11,0.3)]",
    gradient: "from-amber-400/35 to-orange-600/15",
  },
};

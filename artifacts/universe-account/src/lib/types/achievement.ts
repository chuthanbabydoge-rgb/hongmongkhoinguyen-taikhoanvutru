export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type AchievementCategory =
  | "account"
  | "social"
  | "creator"
  | "marketplace"
  | "world_builder"
  | "explorer";

export interface AchievementReward {
  type: "xp" | "title" | "badge" | "cosmetic";
  label: string;
  value: number | string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  reward: AchievementReward;
  maxProgress: number;
  secret?: boolean;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rewardClaimed?: boolean;
}

export const RARITY_META: Record<
  AchievementRarity,
  {
    label: string;
    color: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
    gradient: string;
    points: number;
    barColor: string;
  }
> = {
  common: {
    label: "Phổ thông",
    color: "text-slate-300",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    glow: "",
    gradient: "from-slate-400/20 to-slate-600/10",
    points: 10,
    barColor: "bg-slate-400",
  },
  rare: {
    label: "Hiếm",
    color: "text-cyan-300",
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    gradient: "from-cyan-400/20 to-blue-600/10",
    points: 25,
    barColor: "bg-cyan-400",
  },
  epic: {
    label: "Sử thi",
    color: "text-violet-300",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.2)]",
    gradient: "from-violet-400/20 to-purple-600/10",
    points: 50,
    barColor: "bg-violet-400",
  },
  legendary: {
    label: "Huyền thoại",
    color: "text-amber-300",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    gradient: "from-amber-400/25 to-orange-600/10",
    points: 100,
    barColor: "bg-amber-400",
  },
};

export const CATEGORY_META: Record<
  AchievementCategory,
  { label: string; icon: string; color: string; bg: string; border: string; gradient: string }
> = {
  account: {
    label: "Tài Khoản",
    icon: "🪪",
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    gradient: "from-violet-500/15 to-purple-700/8",
  },
  social: {
    label: "Mạng Xã Hội",
    icon: "🌐",
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    gradient: "from-cyan-500/15 to-blue-700/8",
  },
  creator: {
    label: "Người Sáng Tạo",
    icon: "⚛️",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    gradient: "from-rose-500/15 to-pink-700/8",
  },
  marketplace: {
    label: "Chợ",
    icon: "💱",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    gradient: "from-emerald-500/15 to-teal-700/8",
  },
  world_builder: {
    label: "Người Xây Dựng",
    icon: "🌍",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    gradient: "from-blue-500/15 to-indigo-700/8",
  },
  explorer: {
    label: "Nhà Thám Hiểm",
    icon: "🚀",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    gradient: "from-amber-500/15 to-orange-700/8",
  },
};

export function computeLevel(totalXP: number): { level: number; xpInLevel: number; xpForNextLevel: number } {
  // Each level requires level * 200 XP
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const xpForLevel = level * 200;
    if (xpUsed + xpForLevel > totalXP) {
      return { level, xpInLevel: totalXP - xpUsed, xpForNextLevel: xpForLevel };
    }
    xpUsed += xpForLevel;
    level++;
  }
}

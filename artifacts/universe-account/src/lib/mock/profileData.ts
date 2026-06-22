import { User } from "../types/user";
import { initialUsers } from "./mockData";
import { initialUserAchievements, allAchievements } from "./achievementData";
import { RARITY_META } from "../types/achievement";

// ── Public profile extended data ──────────────────────────────────────────────

export interface PublicBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: string;
}

export interface PublicAsset {
  id: string;
  name: string;
  icon: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  value: number;
  acquiredAt: string;
}

export interface ActivityEntry {
  id: string;
  type: "achievement" | "trade" | "world" | "badge" | "level" | "social";
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  highlight?: boolean;
}

export interface PublicProfile {
  user: User;
  displayName: string;
  totalXP: number;
  achievementScore: number;
  reputationTier: "bronze" | "silver" | "gold" | "diamond";
  reputationScore: number;
  badges: PublicBadge[];
  assets: PublicAsset[];
  activity: ActivityEntry[];
  followerCount: number;
  followingCount: number;
}

// ── Reputation tier calculation ───────────────────────────────────────────────

function repTier(level: number, trades: number): "bronze" | "silver" | "gold" | "diamond" {
  if (level >= 60 || trades >= 300) return "diamond";
  if (level >= 30 || trades >= 80) return "gold";
  if (level >= 10 || trades >= 20) return "silver";
  return "bronze";
}

export const REP_TIER_META: Record<
  "bronze" | "silver" | "gold" | "diamond",
  { label: string; icon: string; color: string; bg: string; border: string; glow: string; gradient: string }
> = {
  bronze: {
    label: "Đồng",
    icon: "🥉",
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "",
    gradient: "from-orange-600/20 to-amber-700/10",
  },
  silver: {
    label: "Bạc",
    icon: "🥈",
    color: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
    glow: "shadow-[0_0_16px_rgba(148,163,184,0.12)]",
    gradient: "from-slate-500/20 to-slate-700/10",
  },
  gold: {
    label: "Vàng",
    icon: "🥇",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.18)]",
    gradient: "from-amber-500/20 to-yellow-700/10",
  },
  diamond: {
    label: "Kim Cương",
    icon: "💎",
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_24px_rgba(6,182,212,0.22)]",
    gradient: "from-cyan-500/20 to-blue-700/10",
  },
};

// ── Avatar gradient by tier ───────────────────────────────────────────────────

export const AVATAR_GRADIENT: Record<string, string> = {
  diamond: "from-cyan-500 via-blue-500 to-violet-600",
  gold: "from-amber-400 via-yellow-500 to-orange-500",
  silver: "from-slate-400 via-slate-300 to-slate-500",
  bronze: "from-orange-500 via-amber-600 to-orange-700",
};

// ── XP helper ─────────────────────────────────────────────────────────────────

function estimateTotalXP(level: number, achievements: number): number {
  // Sum of (i * 200) for levels 1..level-1
  let xp = 0;
  for (let i = 1; i < level; i++) xp += i * 200;
  xp += achievements * 35; // bonus per achievement
  return xp;
}

// ── Badges per user ───────────────────────────────────────────────────────────

const adminBadges: PublicBadge[] = [
  { id: "b1", name: "Người Tiên Phong", icon: "🏴‍☠️", description: "Một trong 1000 tài khoản đầu tiên trên Universe.", rarity: "legendary", earnedAt: new Date(Date.now() - 86400000 * 300).toISOString() },
  { id: "b2", name: "Galactic Sovereign", icon: "👑", description: "Trở thành quản trị viên trong ít nhất một thế giới.", rarity: "legendary", earnedAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  { id: "b3", name: "Community Star", icon: "⭐", description: "Nhận 50 lượt chứng thực từ cộng đồng.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 160).toISOString() },
  { id: "b4", name: "Quantum Merchant", icon: "⚡", description: "Hoàn thành 350+ giao dịch trên 3+ thế giới.", rarity: "legendary", earnedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "b5", name: "Digital Artisan", icon: "🎨", description: "Kích hoạt 3 module sáng tạo trong tài khoản.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 150).toISOString() },
  { id: "b6", name: "World Architect", icon: "🏛️", description: "Xây dựng 3 thế giới và thu hút 500+ du khách.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 200).toISOString() },
  { id: "b7", name: "SafePass Guardian", icon: "🛡️", description: "Kích hoạt xác thực hai yếu tố.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 300).toISOString() },
  { id: "b8", name: "Vault Keeper", icon: "🏛️", description: "Sở hữu 500+ tài sản từ khắp vũ trụ.", rarity: "epic", earnedAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: "b9", name: "Masterpiece", icon: "🏅", description: "Một tác phẩm đạt trên 1000 lượt tải.", rarity: "epic", earnedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: "b10", name: "Galaxy Ambassador", icon: "🌐", description: "Nhận 100+ chứng thực với điểm cộng đồng 85+.", rarity: "epic", earnedAt: new Date(Date.now() - 86400000 * 50).toISOString() },
];

const creatorBadges: PublicBadge[] = [
  { id: "b1", name: "Digital Artisan", icon: "🎨", description: "Kích hoạt 3 module sáng tạo trong tài khoản.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 80).toISOString() },
  { id: "b2", name: "Community Star", icon: "⭐", description: "Nhận 50 lượt chứng thực từ cộng đồng.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: "b3", name: "SafePass Guardian", icon: "🛡️", description: "Kích hoạt xác thực hai yếu tố.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "b4", name: "Void Walker", icon: "🌌", description: "Khám phá 3 thế giới khác nhau trong vũ trụ.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: "b5", name: "Gene Weaver", icon: "🔬", description: "Lai tạo 10 thực thể với đặc điểm hiếm.", rarity: "rare", earnedAt: new Date(Date.now() - 86400000 * 130).toISOString() },
];

const userBadges: PublicBadge[] = [
  { id: "b1", name: "Người Mới Nổi", icon: "👍", description: "Nhận 5 lượt chứng thực từ cộng đồng.", rarity: "common", earnedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "b2", name: "Tia Sáng Sáng Tạo", icon: "✨", description: "Xuất bản nội dung sáng tạo đầu tiên.", rarity: "common", earnedAt: new Date(Date.now() - 86400000 * 55).toISOString() },
];

// ── Assets per user ───────────────────────────────────────────────────────────

function asset(id: string, name: string, icon: string, category: string, rarity: PublicAsset["rarity"], value: number, daysAgo: number): PublicAsset {
  return { id, name, icon, category, rarity, value, acquiredAt: new Date(Date.now() - 86400000 * daysAgo).toISOString() };
}

const adminAssets: PublicAsset[] = [
  asset("a1", "Cosmic Artifact", "🌌", "Collectible", "legendary", 98000, 7),
  asset("a2", "Quantum Shard", "💎", "Material", "epic", 45000, 30),
  asset("a3", "Stellar Core", "⭐", "Energy", "epic", 28000, 45),
  asset("a4", "Void Crystal", "🔮", "Material", "rare", 12000, 60),
  asset("a5", "Nebula Dust", "🌫️", "Material", "rare", 3500, 90),
  asset("a6", "Aurora Frame", "🖼️", "Cosmetic", "rare", 8500, 120),
  asset("a7", "Galaxy Map", "🗺️", "Blueprint", "epic", 22000, 15),
  asset("a8", "Photon Lance", "⚡", "Weapon", "legendary", 75000, 5),
  asset("a9", "Neural Chip", "🧠", "Enhancement", "rare", 6200, 80),
  asset("a10", "Warp Engine", "🚀", "Vehicle", "epic", 38000, 25),
  asset("a11", "Plasma Shield", "🛡️", "Defense", "rare", 9800, 35),
  asset("a12", "Star Chart", "📡", "Blueprint", "common", 1200, 180),
];

const creatorAssets: PublicAsset[] = [
  asset("a1", "Art Module Alpha", "🎨", "Creator", "rare", 3200, 30),
  asset("a2", "Reality Brush", "✨", "Creator", "epic", 18500, 10),
  asset("a3", "Void Crystal", "🔮", "Material", "rare", 12000, 60),
  asset("a4", "Nebula Dust", "🌫️", "Material", "rare", 3500, 45),
  asset("a5", "Hologram Kit", "📦", "Creator", "rare", 7800, 80),
  asset("a6", "Sound Matrix", "🎵", "Creator", "common", 1500, 120),
];

const userAssets: PublicAsset[] = [
  asset("a1", "Starter Kit", "📦", "Starter", "common", 500, 60),
  asset("a2", "Explorer Compass", "🧭", "Tool", "common", 800, 50),
  asset("a3", "Nebula Dust", "🌫️", "Material", "common", 350, 40),
];

// ── Activity feeds ────────────────────────────────────────────────────────────

function act(id: string, type: ActivityEntry["type"], icon: string, title: string, description: string, daysAgo: number, highlight = false): ActivityEntry {
  return { id, type, icon, title, description, timestamp: new Date(Date.now() - 86400000 * daysAgo).toISOString(), highlight };
}

const adminActivity: ActivityEntry[] = [
  act("a1", "achievement", "👑", "Mở Khóa: Chúa Tể Vũ Trụ", "Thành tích Huyền Thoại +100 điểm", 2, true),
  act("a2", "trade", "⚡", "Bán Photon Lance", "Giao dịch thành công · 75.000 UC", 5),
  act("a3", "level", "🌟", "Đạt Cấp 87!", "Cột mốc cấp độ quan trọng", 8, true),
  act("a4", "world", "🌌", "Tạo Thế Giới: Nebula Nexus", "10.000 du khách đạt được", 14),
  act("a5", "badge", "🏆", "Nhận Huy Hiệu: Masterpiece", "Tác phẩm đạt 1000+ lượt tải", 10, true),
  act("a6", "social", "👍", "142 Chứng Thực Cộng Đồng", "Cột mốc chứng thực mới", 15),
  act("a7", "trade", "💎", "Mua Quantum Shard", "Giao dịch thành công · 45.000 UC", 30),
  act("a8", "achievement", "🌐", "Mở Khóa: Đại Sứ Vũ Trụ", "Thành tích Sử Thi +50 điểm", 50),
  act("a9", "world", "⭐", "Nâng Cấp: Stellar Commons", "Nâng cấp lên 45.000+ thành viên", 60),
  act("a10", "social", "🌟", "Đạt Danh Tiếng Kim Cương", "Cấp độ danh tiếng cao nhất", 90, true),
];

const creatorActivity: ActivityEntry[] = [
  act("a1", "trade", "🎨", "Bán Art Module", "Giao dịch thành công · 3.200 UC", 0),
  act("a2", "badge", "⭐", "Nhận Huy Hiệu: Community Star", "50 chứng thực từ cộng đồng", 60, true),
  act("a3", "achievement", "🏗️", "Tiến Độ: Kiến Trúc Sư", "3/4 thế giới hoàn thành", 80),
  act("a4", "world", "⚛️", "Nâng Cấp: Quantum Forge", "Vai trò Creator được xác nhận", 100),
  act("a5", "level", "✨", "Đạt Cấp 42!", "Cột mốc cấp độ quan trọng", 45, true),
  act("a6", "trade", "💡", "Bán Design Package", "Giao dịch thành công · 1.800 UC", 120),
  act("a7", "social", "👍", "38 Chứng Thực Cộng Đồng", "Cột mốc chứng thực mới", 150),
];

const userActivity: ActivityEntry[] = [
  act("a1", "achievement", "🚀", "Mở Khóa: Bước Chân Đầu Tiên", "Thành tích Phổ Thông +10 điểm", 60),
  act("a2", "trade", "🤝", "Giao Dịch Đầu Tiên", "Hoàn thành giao dịch đầu tiên!", 50, true),
  act("a3", "world", "🌌", "Tham Gia: Nebula Nexus", "Gia nhập thế giới đầu tiên", 58),
  act("a4", "level", "⭐", "Đạt Cấp 12!", "Bắt đầu hành trình", 10),
  act("a5", "social", "🌍", "Tham Gia Universe", "Chào mừng bạn đến vũ trụ!", 60),
];

// ── Lookup by username ─────────────────────────────────────────────────────────

function buildProfile(user: User, badges: PublicBadge[], assets: PublicAsset[], activity: ActivityEntry[]): PublicProfile {
  const userAchs = initialUserAchievements.filter((u) => u.userId === user.id && u.isUnlocked);
  const achievementScore = userAchs.reduce((acc, ua) => {
    const a = allAchievements.find((x) => x.id === ua.achievementId);
    return acc + (a ? RARITY_META[a.rarity].points : 0);
  }, 0);
  const totalXP = estimateTotalXP(user.level, user.stats.achievements);
  const tier = repTier(user.level, user.stats.tradesCompleted);
  const repScore = Math.min(1000, Math.round(achievementScore * 1.2 + user.securityScore * 2));
  const followerCount = user.id === "user-admin" ? 1284 : user.id === "user-creator" ? 487 : 23;
  const followingCount = user.id === "user-admin" ? 142 : user.id === "user-creator" ? 98 : 12;

  return {
    user,
    displayName: user.id === "user-admin" ? "Cosmos Admin" : user.id === "user-creator" ? "Star Creator" : "Universe User",
    totalXP,
    achievementScore,
    reputationTier: tier,
    reputationScore: repScore,
    badges,
    assets,
    activity,
    followerCount,
    followingCount,
  };
}

const profileMap: Record<string, PublicProfile> = {};

for (const u of initialUsers) {
  const key = u.username.toLowerCase();
  const badges = u.id === "user-admin" ? adminBadges : u.id === "user-creator" ? creatorBadges : userBadges;
  const assets = u.id === "user-admin" ? adminAssets : u.id === "user-creator" ? creatorAssets : userAssets;
  const activity = u.id === "user-admin" ? adminActivity : u.id === "user-creator" ? creatorActivity : userActivity;
  profileMap[key] = buildProfile(u, badges, assets, activity);
}

export function getPublicProfile(username: string): PublicProfile | null {
  return profileMap[username.toLowerCase()] ?? null;
}

export function getAllPublicProfiles(): PublicProfile[] {
  return Object.values(profileMap);
}

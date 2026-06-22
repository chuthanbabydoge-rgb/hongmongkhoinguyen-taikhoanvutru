/**
 * accountService.ts
 *
 * Lớp dịch vụ tài khoản trung tâm — Universe Account Service Layer
 *
 * Mục đích:
 *   - Cung cấp API thống nhất cho tất cả dữ liệu tài khoản
 *   - Đóng vai trò cổng kết nối (gateway) cho Universe Hub
 *   - Mỗi hàm có chú thích `// HUB:` mô tả endpoint REST sẽ thay thế
 *     khi tích hợp backend thực sự
 *
 * Kiến trúc:
 *   accountService  ←→  Universe Hub (tương lai)
 *        ↓
 *   achievementService / notificationService / avatarService / mockApi
 *        ↓
 *   localStorage (hiện tại)  →  Supabase / PostgreSQL (tương lai)
 */

import { User, UserStats, ConnectedWorld, Role } from "../types/user";
import { UserAvatarConfig } from "../types/avatar";
import { Achievement, UserAchievement } from "../types/achievement";
import { Notification } from "../types/notification";

import { apiGetCurrentUser } from "../mock/mockApi";
import { apiGetAvatarConfig } from "./avatarService";
import { apiGetAllAchievements, apiGetUserAchievements } from "./achievementService";
import { apiGetNotifications } from "./notificationService";

import { authStore } from "../store/authStore";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Return Types ──────────────────────────────────────────────────────────────

/**
 * Hồ sơ công khai — dữ liệu an toàn để chia sẻ với Universe Hub
 * Không bao gồm email, bảo mật, phiên, thiết bị
 */
export interface PublicProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  level: number;
  title: string;
  role: Role;
  membershipStatus: "free" | "premium" | "enterprise";
  stats: UserStats;
  connectedWorlds: ConnectedWorld[];
  joinedAt: string;
}

/**
 * Dữ liệu avatar đầy đủ — cấu hình hiện tại kèm theo metadata
 */
export interface AvatarData {
  config: UserAvatarConfig;
  currentFrameId: string;
  currentBackgroundId: string;
  currentBadgeId: string | null;
  currentTitleId: string;
  currentThemeId: string;
  reputation: number;
  displayName: string;
}

/**
 * Dữ liệu thành tích đầy đủ — định nghĩa + tiến trình của người dùng
 */
export interface AchievementsData {
  definitions: Achievement[];
  userProgress: UserAchievement[];
  unlockedCount: number;
  totalCount: number;
  completionPercent: number;
}

/**
 * Bản tóm tắt thông báo — danh sách + thống kê
 */
export interface NotificationsData {
  items: Notification[];
  unreadCount: number;
  totalCount: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentToken(): string {
  const token = authStore.getToken();
  if (!token) throw new Error("Chưa đăng nhập — không có token xác thực.");
  return token;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Lấy hồ sơ đầy đủ của người dùng đang đăng nhập.
 *
 * HUB: GET /api/v1/account/profile
 *   Headers: Authorization: Bearer <hub_token>
 *   Response: { user: User }
 *
 * SUPABASE: Replace with supabase.from('users').select('*').eq('id', userId).single()
 */
export async function getProfile(): Promise<User> {
  await delay(rand(200, 400));
  const token = getCurrentToken();
  return apiGetCurrentUser(token);
}

/**
 * Lấy cấu hình avatar và thông tin hiển thị của người dùng.
 *
 * HUB: GET /api/v1/account/avatar
 *   Headers: Authorization: Bearer <hub_token>
 *   Response: { avatar: AvatarData }
 *
 * SUPABASE: Replace with supabase.from('avatar_configs').select('*').eq('userId', userId).single()
 */
export async function getAvatar(userId: string): Promise<AvatarData> {
  const config = await apiGetAvatarConfig(userId);
  return {
    config,
    currentFrameId: config.currentFrameId,
    currentBackgroundId: config.currentBackgroundId,
    currentBadgeId: config.currentBadgeId ?? null,
    currentTitleId: config.currentTitleId,
    currentThemeId: config.currentThemeId,
    reputation: config.reputation,
    displayName: config.displayName,
  };
}

/**
 * Lấy toàn bộ thành tích — định nghĩa toàn cục + tiến trình người dùng.
 *
 * HUB: GET /api/v1/account/achievements
 *   Headers: Authorization: Bearer <hub_token>
 *   Response: { achievements: AchievementsData }
 *
 * SUPABASE:
 *   definitions  → supabase.from('achievements').select('*')
 *   userProgress → supabase.from('user_achievements').select('*').eq('userId', userId)
 */
export async function getAchievements(userId: string): Promise<AchievementsData> {
  const [definitions, userProgress] = await Promise.all([
    apiGetAllAchievements(),
    apiGetUserAchievements(userId),
  ]);

  const unlockedCount = userProgress.filter((a) => a.isUnlocked).length;
  const totalCount = definitions.length;
  const completionPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    definitions,
    userProgress,
    unlockedCount,
    totalCount,
    completionPercent,
  };
}

/**
 * Lấy danh sách thông báo của người dùng.
 *
 * HUB: GET /api/v1/account/notifications
 *   Headers: Authorization: Bearer <hub_token>
 *   Query params: ?limit=50&offset=0&unreadOnly=false
 *   Response: { notifications: NotificationsData }
 *
 * SUPABASE: Replace with
 *   supabase.from('notifications')
 *     .select('*')
 *     .eq('userId', userId)
 *     .eq('isDeleted', false)
 *     .order('createdAt', { ascending: false })
 */
export async function getNotifications(userId: string): Promise<NotificationsData> {
  const items = await apiGetNotifications(userId);
  const unreadCount = items.filter((n) => !n.isRead).length;

  return {
    items,
    unreadCount,
    totalCount: items.length,
  };
}

/**
 * Lấy hồ sơ công khai — dữ liệu an toàn chia sẻ với Universe Hub
 * và các ứng dụng bên thứ ba (không có email, bảo mật, phiên).
 *
 * HUB: GET /api/v1/account/public-profile/:userId
 *   Không yêu cầu xác thực — endpoint công khai
 *   Response: { profile: PublicProfile }
 *
 * SUPABASE: Replace with
 *   supabase.from('users')
 *     .select('id, username, avatar, bio, level, title, role, membershipStatus, stats, connectedWorlds, createdAt')
 *     .eq('id', userId)
 *     .single()
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  await delay(rand(150, 350));

  const token = authStore.getToken();
  if (!token) throw new Error("Phiên đăng nhập không hợp lệ.");

  const user = await apiGetCurrentUser(token);

  if (user.id !== userId) {
    throw new Error("Không tìm thấy người dùng hoặc hồ sơ ở chế độ riêng tư.");
  }

  const publicProfile: PublicProfile = {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    level: user.level,
    title: user.title,
    role: user.role,
    membershipStatus: user.membershipStatus,
    stats: user.stats,
    connectedWorlds: user.connectedWorlds,
    joinedAt: user.createdAt,
  };

  return publicProfile;
}

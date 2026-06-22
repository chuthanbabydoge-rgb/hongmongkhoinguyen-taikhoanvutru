import { UserAvatarConfig } from "../types/avatar";
import { avatarStore } from "../store/avatarStore";
import { initialAvatarConfigs } from "../mock/avatarData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function ensureSeeded(userId: string) {
  if (!avatarStore.getForUser(userId)) {
    const seed = initialAvatarConfigs.find((c) => c.userId === userId);
    if (seed) avatarStore.upsert(seed);
    else {
      avatarStore.upsert({
        userId,
        displayName: "Universe Citizen",
        initials: "UC",
        level: 1,
        reputation: 0,
        currentFrameId: "frame-none",
        currentBackgroundId: "bg-void",
        currentBadgeId: null,
        currentTitleId: "title-citizen",
        currentThemeId: "theme-void",
        ownedFrameIds: ["frame-none"],
        ownedBackgroundIds: ["bg-void"],
        ownedBadgeIds: ["badge-none"],
        ownedTitleIds: ["title-citizen"],
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

// SUPABASE: Replace with supabase.from('avatar_configs').select('*').eq('userId', userId).single()
export async function apiGetAvatarConfig(userId: string): Promise<UserAvatarConfig> {
  await delay(rand(250, 450));
  ensureSeeded(userId);
  return avatarStore.getForUser(userId)!;
}

// SUPABASE: Replace with supabase.from('avatar_configs').upsert({ ...config })
export async function apiSaveAvatarConfig(config: UserAvatarConfig): Promise<UserAvatarConfig> {
  await delay(rand(300, 500));
  const updated = { ...config, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('avatar_configs').update({ currentFrameId }).eq('userId', userId)
export async function apiEquipFrame(userId: string, frameId: string): Promise<UserAvatarConfig> {
  await delay(rand(200, 350));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated = { ...config, currentFrameId: frameId, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('avatar_configs').update({ currentBackgroundId }).eq('userId', userId)
export async function apiEquipBackground(userId: string, backgroundId: string): Promise<UserAvatarConfig> {
  await delay(rand(200, 350));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated = { ...config, currentBackgroundId: backgroundId, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('avatar_configs').update({ currentBadgeId }).eq('userId', userId)
export async function apiEquipBadge(userId: string, badgeId: string | null): Promise<UserAvatarConfig> {
  await delay(rand(200, 350));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated = { ...config, currentBadgeId: badgeId, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('avatar_configs').update({ currentTitleId }).eq('userId', userId)
export async function apiEquipTitle(userId: string, titleId: string): Promise<UserAvatarConfig> {
  await delay(rand(200, 350));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated = { ...config, currentTitleId: titleId, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// SUPABASE: Replace with supabase.from('avatar_configs').update({ currentThemeId }).eq('userId', userId)
export async function apiEquipTheme(userId: string, themeId: string): Promise<UserAvatarConfig> {
  await delay(rand(200, 350));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated = { ...config, currentThemeId: themeId, lastUpdated: new Date().toISOString() };
  avatarStore.upsert(updated);
  return updated;
}

// Apply a full preset at once
export async function apiApplyPreset(userId: string, preset: {
  frameId: string; backgroundId: string; badgeId: string; titleId: string; themeId: string;
}): Promise<UserAvatarConfig> {
  await delay(rand(400, 650));
  ensureSeeded(userId);
  const config = avatarStore.getForUser(userId)!;
  const updated: UserAvatarConfig = {
    ...config,
    currentFrameId: preset.frameId,
    currentBackgroundId: preset.backgroundId,
    currentBadgeId: preset.badgeId,
    currentTitleId: preset.titleId,
    currentThemeId: preset.themeId,
    lastUpdated: new Date().toISOString(),
  };
  avatarStore.upsert(updated);
  return updated;
}

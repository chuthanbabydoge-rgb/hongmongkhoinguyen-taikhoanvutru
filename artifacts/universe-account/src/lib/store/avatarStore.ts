import { UserAvatarConfig } from "../types/avatar";

const AVATAR_KEY = "universe_avatar_configs";

export const avatarStore = {
  getAll(): UserAvatarConfig[] {
    try {
      const raw = localStorage.getItem(AVATAR_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAll(configs: UserAvatarConfig[]) {
    localStorage.setItem(AVATAR_KEY, JSON.stringify(configs));
  },

  getForUser(userId: string): UserAvatarConfig | null {
    return this.getAll().find((c) => c.userId === userId) ?? null;
  },

  upsert(config: UserAvatarConfig) {
    const all = this.getAll();
    const idx = all.findIndex((c) => c.userId === config.userId);
    if (idx === -1) {
      this.setAll([...all, config]);
    } else {
      all[idx] = config;
      this.setAll(all);
    }
  },

  clear(userId: string) {
    this.setAll(this.getAll().filter((c) => c.userId !== userId));
  },
};

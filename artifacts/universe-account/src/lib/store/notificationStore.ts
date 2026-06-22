import { Notification, NotificationSettings, NotificationCategory } from "../types/notification";

const NOTIF_KEY = "universe_notifications_v4";
const SETTINGS_KEY = "universe_notification_settings_v4";

const DEFAULT_CATEGORIES: NotificationSettings["categories"] = {
  system: { enabled: true, push: true, sound: true },
  security: { enabled: true, push: true, sound: true },
  marketplace: { enabled: true, push: true, sound: false },
  rewards: { enabled: true, push: true, sound: true },
  social: { enabled: true, push: false, sound: false },
  world_events: { enabled: true, push: false, sound: false },
};

export const notificationStore = {
  getAll(): Notification[] {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  setAll(notifications: Notification[]) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  },

  getForUser(userId: string): Notification[] {
    return this.getAll()
      .filter((n) => n.userId === userId && !n.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadCount(userId: string): number {
    return this.getForUser(userId).filter((n) => !n.isRead).length;
  },

  markRead(id: string) {
    const all = this.getAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], isRead: true, readAt: new Date().toISOString() };
      this.setAll(all);
    }
  },

  markAllRead(userId: string) {
    const now = new Date().toISOString();
    const all = this.getAll().map((n) =>
      n.userId === userId && !n.isRead ? { ...n, isRead: true, readAt: now } : n
    );
    this.setAll(all);
  },

  markCategoryRead(userId: string, category: NotificationCategory) {
    const now = new Date().toISOString();
    const all = this.getAll().map((n) =>
      n.userId === userId && n.category === category && !n.isRead
        ? { ...n, isRead: true, readAt: now }
        : n
    );
    this.setAll(all);
  },

  delete(id: string) {
    const all = this.getAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], isDeleted: true };
      this.setAll(all);
    }
  },

  deleteAll(userId: string) {
    const all = this.getAll().map((n) =>
      n.userId === userId ? { ...n, isDeleted: true } : n
    );
    this.setAll(all);
  },

  add(notification: Notification) {
    const all = this.getAll();
    this.setAll([notification, ...all]);
  },

  getSettings(userId: string): NotificationSettings {
    try {
      const raw = localStorage.getItem(`${SETTINGS_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      userId,
      categories: DEFAULT_CATEGORIES,
      globalSound: true,
      globalPush: true,
      doNotDisturb: false,
    };
  },

  saveSettings(settings: NotificationSettings) {
    localStorage.setItem(`${SETTINGS_KEY}_${settings.userId}`, JSON.stringify(settings));
  },

  clear(userId: string) {
    const all = this.getAll().filter((n) => n.userId !== userId);
    this.setAll(all);
    localStorage.removeItem(`${SETTINGS_KEY}_${userId}`);
  },
};

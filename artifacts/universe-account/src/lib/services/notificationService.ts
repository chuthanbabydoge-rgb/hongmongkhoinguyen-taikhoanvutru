import { Notification, NotificationSettings, NotificationCategory } from "../types/notification";
import { notificationStore } from "../store/notificationStore";
import { initialNotifications, liveNotifPool, LiveNotifTemplate } from "../mock/notificationData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function genId() { return `notif-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function ensureSeeded(userId: string) {
  const existing = notificationStore.getAll().filter((n) => n.userId === userId);
  if (existing.length === 0) {
    const all = notificationStore.getAll();
    const seeds = initialNotifications.filter((n) => n.userId === userId);
    notificationStore.setAll([...seeds, ...all]);
  }
}

// SUPABASE: Replace with supabase.from('notifications').select('*').eq('userId', userId).eq('isDeleted', false).order('createdAt', { ascending: false })
export async function apiGetNotifications(userId: string): Promise<Notification[]> {
  await delay(rand(200, 400));
  ensureSeeded(userId);
  return notificationStore.getForUser(userId);
}

// SUPABASE: Replace with supabase.from('notifications').select('count').eq('userId', userId).eq('isRead', false).eq('isDeleted', false)
export async function apiGetUnreadCount(userId: string): Promise<number> {
  ensureSeeded(userId);
  return notificationStore.getUnreadCount(userId);
}

// SUPABASE: Replace with supabase.from('notifications').update({ isRead: true, readAt: new Date() }).eq('id', id)
export async function apiMarkRead(id: string): Promise<void> {
  await delay(rand(100, 200));
  notificationStore.markRead(id);
}

// SUPABASE: Replace with supabase.from('notifications').update({ isRead: true, readAt: new Date() }).eq('userId', userId)
export async function apiMarkAllRead(userId: string): Promise<void> {
  await delay(rand(200, 350));
  notificationStore.markAllRead(userId);
}

// SUPABASE: Replace with supabase.from('notifications').update({ isRead: true }).eq('userId', userId).eq('category', category)
export async function apiMarkCategoryRead(userId: string, category: NotificationCategory): Promise<void> {
  await delay(rand(150, 250));
  notificationStore.markCategoryRead(userId, category);
}

// SUPABASE: Replace with supabase.from('notifications').update({ isDeleted: true }).eq('id', id)
export async function apiDeleteNotification(id: string): Promise<void> {
  await delay(rand(100, 200));
  notificationStore.delete(id);
}

// SUPABASE: Replace with supabase.from('notifications').update({ isDeleted: true }).eq('userId', userId)
export async function apiDeleteAll(userId: string): Promise<void> {
  await delay(rand(200, 350));
  notificationStore.deleteAll(userId);
}

// SUPABASE: Replace with supabase.from('notification_settings').select('*').eq('userId', userId).single()
export async function apiGetSettings(userId: string): Promise<NotificationSettings> {
  await delay(rand(150, 250));
  return notificationStore.getSettings(userId);
}

// SUPABASE: Replace with supabase.from('notification_settings').upsert({ ...settings })
export async function apiSaveSettings(settings: NotificationSettings): Promise<void> {
  await delay(rand(200, 350));
  notificationStore.saveSettings(settings);
}

// Simulate a realtime notification arriving (call from a setInterval in the UI)
export function generateLiveNotification(userId: string): Notification {
  const template: LiveNotifTemplate =
    liveNotifPool[Math.floor(Math.random() * liveNotifPool.length)];
  const notif: Notification = {
    id: genId(),
    userId,
    category: template.category,
    type: template.type,
    priority: template.priority,
    title: template.title,
    body: template.body,
    isRead: false,
    isDeleted: false,
    actionLabel: template.actionLabel,
    createdAt: new Date().toISOString(),
  };
  notificationStore.add(notif);
  return notif;
}

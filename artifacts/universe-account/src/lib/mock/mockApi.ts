import { User, Role } from "../types/user";
import { Session } from "../types/session";
import { Device } from "../types/device";
import { initialUsers, initialSessions, initialDevices, DEMO_PASSWORDS } from "./mockData";
import { generateId } from "../utils/crypto";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function mergeUserDefaults(stored: User): User {
  const seed = initialUsers.find(u => u.id === stored.id);
  return {
    bio: seed?.bio ?? "",
    status: seed?.status ?? "active",
    membershipStatus: seed?.membershipStatus ?? "free",
    stats: seed?.stats ?? { worldsJoined: 0, assetsOwned: 0, tradesCompleted: 0, achievements: 0 },
    connectedWorlds: seed?.connectedWorlds ?? [],
    connectedModules: seed?.connectedModules ?? [],
    ...stored,
  };
}

function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem("universe_users");
    if (stored) {
      const parsed: User[] = JSON.parse(stored);
      const migrated = parsed.map(mergeUserDefaults);
      return migrated;
    }
  } catch {}
  localStorage.setItem("universe_users", JSON.stringify(initialUsers));
  return initialUsers;
}

function saveUsers(users: User[]) {
  localStorage.setItem("universe_users", JSON.stringify(users));
}

function getStoredSessions(): Session[] {
  try {
    const stored = localStorage.getItem("universe_sessions");
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem("universe_sessions", JSON.stringify(initialSessions));
  return initialSessions;
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem("universe_sessions", JSON.stringify(sessions));
}

function getStoredDevices(): Device[] {
  try {
    const stored = localStorage.getItem("universe_devices");
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem("universe_devices", JSON.stringify(initialDevices));
  return initialDevices;
}

function saveDevices(devices: Device[]) {
  localStorage.setItem("universe_devices", JSON.stringify(devices));
}

// SUPABASE: Replace with supabase.auth.signInWithPassword()
export async function apiLogin(email: string, password: string): Promise<{ user: User; token: string }> {
  await delay(rand(400, 800));
  const users = getStoredUsers();
  const user = users.find(u => u.email === email);
  if (!user) throw new Error("Invalid credentials");
  const expectedPassword = DEMO_PASSWORDS[email];
  if (password !== expectedPassword) throw new Error("Invalid credentials");
  const updatedUser = { ...user, lastLogin: new Date().toISOString() };
  saveUsers(users.map(u => u.id === user.id ? updatedUser : u));
  const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
  return { user: updatedUser, token };
}

// SUPABASE: Replace with supabase.auth.signUp()
export async function apiRegister(
  username: string, email: string, password: string
): Promise<{ user: User }> {
  await delay(rand(400, 800));
  const users = getStoredUsers();
  if (users.find(u => u.email === email)) throw new Error("Email already registered");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  const newUser: User = {
    id: generateId("user"),
    username,
    email,
    avatar: username.slice(0, 2).toUpperCase(),
    level: 1,
    title: "Universe Pioneer",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    role: "user",
    permissions: ["read:content"],
    twoFactorEnabled: false,
    securityScore: 30
  };
  DEMO_PASSWORDS[email] = password;
  saveUsers([...users, newUser]);
  const newSession: Session = {
    id: generateId("session"),
    userId: newUser.id,
    device: "Unknown Device",
    browser: "Unknown Browser",
    os: "Unknown OS",
    ip: "0.0.0.0",
    location: "Unknown",
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    isCurrent: true
  };
  const sessions = getStoredSessions();
  saveSessions([...sessions, newSession]);
  return { user: newUser };
}

// SUPABASE: Replace with supabase.auth.getUser()
export async function apiGetCurrentUser(token: string): Promise<User> {
  await delay(rand(200, 400));
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) throw new Error("Token expired");
    const users = getStoredUsers();
    const user = users.find(u => u.id === payload.userId);
    if (!user) throw new Error("User not found");
    return user;
  } catch {
    throw new Error("Invalid token");
  }
}

// SUPABASE: Replace with supabase.from('users').update()
export async function apiUpdateUser(userId: string, updates: Partial<User>): Promise<User> {
  await delay(rand(300, 600));
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  const updated = { ...users[idx], ...updates };
  users[idx] = updated;
  saveUsers(users);
  return updated;
}

// SUPABASE: Replace with supabase.from('sessions').select().eq('userId', userId)
export async function apiGetSessions(userId: string): Promise<Session[]> {
  await delay(rand(300, 500));
  const sessions = getStoredSessions();
  return sessions.filter(s => s.userId === userId);
}

// SUPABASE: Replace with supabase.from('sessions').delete().eq('id', sessionId)
export async function apiRevokeSession(sessionId: string): Promise<void> {
  await delay(rand(300, 500));
  const sessions = getStoredSessions();
  saveSessions(sessions.filter(s => s.id !== sessionId));
}

// SUPABASE: Replace with supabase.from('sessions').delete().eq('userId', userId).neq('isCurrent', true)
export async function apiRevokeAllSessions(userId: string, currentSessionId: string): Promise<void> {
  await delay(rand(400, 700));
  const sessions = getStoredSessions();
  saveSessions(sessions.filter(s => s.userId !== userId || s.id === currentSessionId));
}

// SUPABASE: Replace with supabase.from('devices').select().eq('userId', userId)
export async function apiGetDevices(userId: string): Promise<Device[]> {
  await delay(rand(300, 500));
  const devices = getStoredDevices();
  return devices.filter(d => d.userId === userId);
}

// SUPABASE: Replace with supabase.from('devices').update({ trusted }).eq('id', deviceId)
export async function apiToggleDeviceTrust(deviceId: string, trusted: boolean): Promise<Device> {
  await delay(rand(200, 400));
  const devices = getStoredDevices();
  const idx = devices.findIndex(d => d.id === deviceId);
  if (idx === -1) throw new Error("Device not found");
  devices[idx] = { ...devices[idx], trusted };
  saveDevices(devices);
  return devices[idx];
}

// SUPABASE: Replace with supabase.from('devices').delete().eq('id', deviceId)
export async function apiRemoveDevice(deviceId: string): Promise<void> {
  await delay(rand(200, 400));
  const devices = getStoredDevices();
  saveDevices(devices.filter(d => d.id !== deviceId));
}

// SUPABASE: Replace with supabase.from('devices').insert()
export async function apiRegisterDevice(userId: string): Promise<Device> {
  await delay(rand(400, 700));
  const newDevice: Device = {
    id: generateId("device"),
    userId,
    name: "Current Browser",
    type: "desktop",
    os: navigator.platform || "Unknown OS",
    browser: navigator.userAgent.includes("Firefox") ? "Firefox" : 
             navigator.userAgent.includes("Safari") ? "Safari" : "Chrome",
    trusted: false,
    lastSeen: new Date().toISOString(),
    registeredAt: new Date().toISOString()
  };
  const devices = getStoredDevices();
  saveDevices([...devices, newDevice]);
  return newDevice;
}

// SUPABASE: Replace with supabase.rpc('toggle_two_factor')
export async function apiToggle2FA(userId: string, enabled: boolean): Promise<User> {
  await delay(rand(500, 900));
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  const scoreChange = enabled ? 20 : -20;
  users[idx] = {
    ...users[idx],
    twoFactorEnabled: enabled,
    securityScore: Math.min(100, Math.max(0, users[idx].securityScore + scoreChange))
  };
  saveUsers(users);
  return users[idx];
}

// SUPABASE: Replace with supabase.auth.updateUser({ password })
export async function apiChangePassword(userId: string, currentPw: string, newPw: string): Promise<void> {
  await delay(rand(500, 900));
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  if (DEMO_PASSWORDS[user.email] !== currentPw) throw new Error("Current password is incorrect");
  if (newPw.length < 6) throw new Error("New password must be at least 6 characters");
  DEMO_PASSWORDS[user.email] = newPw;
}

export async function apiUpdateRole(userId: string, role: Role): Promise<User> {
  await delay(rand(300, 600));
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  users[idx] = { ...users[idx], role };
  saveUsers(users);
  return users[idx];
}

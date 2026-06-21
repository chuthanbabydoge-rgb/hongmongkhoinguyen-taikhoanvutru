import { User } from "../types/user";
import { Session } from "../types/session";
import { Device } from "../types/device";

export const initialUsers: User[] = [
  {
    id: "user-admin",
    username: "Admin",
    email: "admin@universe.io",
    avatar: "AD",
    level: 87,
    title: "Cosmos Guardian",
    createdAt: new Date(Date.now() - 10000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "admin",
    permissions: [
      "read:content", "write:content", "delete:content",
      "manage:users", "manage:roles", "view:analytics",
      "manage:settings", "access:api"
    ],
    twoFactorEnabled: true,
    securityScore: 95
  },
  {
    id: "user-creator",
    username: "Creator",
    email: "creator@universe.io",
    avatar: "CR",
    level: 42,
    title: "Star Architect",
    createdAt: new Date(Date.now() - 5000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "creator",
    permissions: ["read:content", "write:content", "view:analytics"],
    twoFactorEnabled: false,
    securityScore: 60
  },
  {
    id: "user-regular",
    username: "User",
    email: "user@universe.io",
    avatar: "US",
    level: 12,
    title: "Universe Pioneer",
    createdAt: new Date(Date.now() - 1000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "user",
    permissions: ["read:content"],
    twoFactorEnabled: false,
    securityScore: 40
  }
];

export const DEMO_PASSWORDS: Record<string, string> = {
  "admin@universe.io": "password123",
  "creator@universe.io": "password123",
  "user@universe.io": "password123"
};

export const initialSessions: Session[] = [
  ...initialUsers.map(user => ({
    id: `session-${user.id}-current`,
    userId: user.id,
    device: "MacBook Pro",
    browser: "Chrome 120",
    os: "macOS 14",
    ip: "192.168.1.1",
    location: "San Francisco, CA",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastActive: new Date().toISOString(),
    isCurrent: true
  })),
  ...initialUsers.map(user => ({
    id: `session-${user.id}-mobile`,
    userId: user.id,
    device: "iPhone 15 Pro",
    browser: "Safari 17",
    os: "iOS 17",
    ip: "10.0.0.2",
    location: "New York, NY",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    isCurrent: false
  })),
  ...initialUsers.map(user => ({
    id: `session-${user.id}-work`,
    userId: user.id,
    device: "Windows PC",
    browser: "Firefox 121",
    os: "Windows 11",
    ip: "172.16.0.5",
    location: "Austin, TX",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false
  }))
];

export const initialDevices: Device[] = [
  ...initialUsers.map(user => ({
    id: `device-${user.id}-mac`,
    userId: user.id,
    name: "MacBook Pro 16\"",
    type: "desktop" as const,
    os: "macOS 14 Sonoma",
    browser: "Chrome 120",
    trusted: true,
    lastSeen: new Date().toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 30).toISOString()
  })),
  ...initialUsers.map(user => ({
    id: `device-${user.id}-iphone`,
    userId: user.id,
    name: "iPhone 15 Pro",
    type: "mobile" as const,
    os: "iOS 17.2",
    browser: "Safari 17",
    trusted: true,
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 14).toISOString()
  })),
  ...initialUsers.map(user => ({
    id: `device-${user.id}-ipad`,
    userId: user.id,
    name: "iPad Pro",
    type: "tablet" as const,
    os: "iPadOS 17",
    browser: "Safari 17",
    trusted: false,
    lastSeen: new Date(Date.now() - 86400000 * 3).toISOString(),
    registeredAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }))
];

import { User } from "../types/user";
import { Session } from "../types/session";
import { Device } from "../types/device";

const adminWorlds = [
  { id: "w1", name: "Nebula Nexus", icon: "🌌", members: 12847, category: "Exploration", joined: true, role: "Admin" },
  { id: "w2", name: "Quantum Forge", icon: "⚛️", members: 8392, category: "Creation", joined: true, role: "Moderator" },
  { id: "w3", name: "Stellar Commons", icon: "⭐", members: 45621, category: "Social", joined: true, role: "Member" },
  { id: "w4", name: "Void Frontier", icon: "🌑", members: 3201, category: "Adventure", joined: false, role: "" },
  { id: "w5", name: "Crystal Matrix", icon: "💎", members: 7890, category: "Trade", joined: true, role: "Elder" },
  { id: "w6", name: "Data Realm", icon: "🔷", members: 19234, category: "Tech", joined: false, role: "" },
];

const creatorWorlds = [
  { id: "w1", name: "Nebula Nexus", icon: "🌌", members: 12847, category: "Exploration", joined: true, role: "Member" },
  { id: "w2", name: "Quantum Forge", icon: "⚛️", members: 8392, category: "Creation", joined: true, role: "Creator" },
  { id: "w3", name: "Stellar Commons", icon: "⭐", members: 45621, category: "Social", joined: false, role: "" },
  { id: "w4", name: "Void Frontier", icon: "🌑", members: 3201, category: "Adventure", joined: false, role: "" },
  { id: "w5", name: "Crystal Matrix", icon: "💎", members: 7890, category: "Trade", joined: false, role: "" },
  { id: "w6", name: "Data Realm", icon: "🔷", members: 19234, category: "Tech", joined: true, role: "Contributor" },
];

const userWorlds = [
  { id: "w1", name: "Nebula Nexus", icon: "🌌", members: 12847, category: "Exploration", joined: true, role: "Member" },
  { id: "w2", name: "Quantum Forge", icon: "⚛️", members: 8392, category: "Creation", joined: false, role: "" },
  { id: "w3", name: "Stellar Commons", icon: "⭐", members: 45621, category: "Social", joined: true, role: "Member" },
  { id: "w4", name: "Void Frontier", icon: "🌑", members: 3201, category: "Adventure", joined: false, role: "" },
  { id: "w5", name: "Crystal Matrix", icon: "💎", members: 7890, category: "Trade", joined: false, role: "" },
  { id: "w6", name: "Data Realm", icon: "🔷", members: 19234, category: "Tech", joined: false, role: "" },
];

const adminModules = [
  { id: "m1", name: "Universal Translator", description: "Real-time language processing across 120 dialects", category: "Communication", enabled: true },
  { id: "m2", name: "Asset Scanner", description: "Scan and catalog digital assets automatically", category: "Tools", enabled: true },
  { id: "m3", name: "Trade Protocol", description: "Secure peer-to-peer trading with escrow", category: "Finance", enabled: true },
  { id: "m4", name: "Neural Link", description: "Enhanced data processing and memory augmentation", category: "Enhancement", enabled: true },
  { id: "m5", name: "Void Walker", description: "Navigate unstable dimensional regions safely", category: "Navigation", enabled: false },
  { id: "m6", name: "Chronicle Logger", description: "Deep activity tracking and analytics dashboard", category: "Analytics", enabled: true },
];

const creatorModules = [
  { id: "m1", name: "Universal Translator", description: "Real-time language processing across 120 dialects", category: "Communication", enabled: true },
  { id: "m2", name: "Asset Scanner", description: "Scan and catalog digital assets automatically", category: "Tools", enabled: true },
  { id: "m3", name: "Trade Protocol", description: "Secure peer-to-peer trading with escrow", category: "Finance", enabled: false },
  { id: "m4", name: "Neural Link", description: "Enhanced data processing and memory augmentation", category: "Enhancement", enabled: true },
  { id: "m5", name: "Void Walker", description: "Navigate unstable dimensional regions safely", category: "Navigation", enabled: false },
  { id: "m6", name: "Chronicle Logger", description: "Deep activity tracking and analytics dashboard", category: "Analytics", enabled: false },
];

const userModules = [
  { id: "m1", name: "Universal Translator", description: "Real-time language processing across 120 dialects", category: "Communication", enabled: true },
  { id: "m2", name: "Asset Scanner", description: "Scan and catalog digital assets automatically", category: "Tools", enabled: false },
  { id: "m3", name: "Trade Protocol", description: "Secure peer-to-peer trading with escrow", category: "Finance", enabled: false },
  { id: "m4", name: "Neural Link", description: "Enhanced data processing and memory augmentation", category: "Enhancement", enabled: false },
  { id: "m5", name: "Void Walker", description: "Navigate unstable dimensional regions safely", category: "Navigation", enabled: false },
  { id: "m6", name: "Chronicle Logger", description: "Deep activity tracking and analytics dashboard", category: "Analytics", enabled: false },
];

export const initialUsers: User[] = [
  {
    id: "user-admin",
    username: "Admin",
    email: "admin@universe.io",
    avatar: "AD",
    bio: "Keeper of the cosmic order. Guardian of all universal gateways. Building the future one dimension at a time.",
    level: 87,
    title: "Cosmos Guardian",
    status: "active",
    membershipStatus: "enterprise",
    createdAt: new Date(Date.now() - 10000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "admin",
    permissions: [
      "read:content", "write:content", "delete:content",
      "manage:users", "manage:roles", "view:analytics",
      "manage:settings", "access:api"
    ],
    twoFactorEnabled: true,
    securityScore: 95,
    stats: { worldsJoined: 4, assetsOwned: 1284, tradesCompleted: 347, achievements: 62 },
    connectedWorlds: adminWorlds,
    connectedModules: adminModules,
  },
  {
    id: "user-creator",
    username: "Creator",
    email: "creator@universe.io",
    avatar: "CR",
    bio: "Architect of digital realities. I craft experiences that transcend the ordinary into the extraordinary.",
    level: 42,
    title: "Star Architect",
    status: "active",
    membershipStatus: "premium",
    createdAt: new Date(Date.now() - 5000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "creator",
    permissions: ["read:content", "write:content", "view:analytics"],
    twoFactorEnabled: false,
    securityScore: 60,
    stats: { worldsJoined: 3, assetsOwned: 487, tradesCompleted: 93, achievements: 28 },
    connectedWorlds: creatorWorlds,
    connectedModules: creatorModules,
  },
  {
    id: "user-regular",
    username: "User",
    email: "user@universe.io",
    avatar: "US",
    bio: "Explorer of the cosmic frontier. Just getting started on this incredible journey.",
    level: 12,
    title: "Universe Pioneer",
    status: "active",
    membershipStatus: "free",
    createdAt: new Date(Date.now() - 1000000000).toISOString(),
    lastLogin: new Date().toISOString(),
    role: "user",
    permissions: ["read:content"],
    twoFactorEnabled: false,
    securityScore: 40,
    stats: { worldsJoined: 2, assetsOwned: 18, tradesCompleted: 4, achievements: 7 },
    connectedWorlds: userWorlds,
    connectedModules: userModules,
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

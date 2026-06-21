export interface ConnectedWorld {
  id: string;
  name: string;
  icon: string;
  members: number;
  category: string;
  joined: boolean;
  role: string;
}

export interface ConnectedModule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface UserStats {
  worldsJoined: number;
  assetsOwned: number;
  tradesCompleted: number;
  achievements: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  level: number;
  title: string;
  status: "active" | "suspended" | "restricted";
  membershipStatus: "free" | "premium" | "enterprise";
  createdAt: string;
  lastLogin: string;
  role: Role;
  permissions: Permission[];
  twoFactorEnabled: boolean;
  securityScore: number;
  stats: UserStats;
  connectedWorlds: ConnectedWorld[];
  connectedModules: ConnectedModule[];
}

export type Role = "admin" | "moderator" | "creator" | "premium" | "user";

export type Permission = 
  | "read:content" 
  | "write:content" 
  | "delete:content" 
  | "manage:users" 
  | "manage:roles" 
  | "view:analytics" 
  | "manage:settings" 
  | "access:api";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  moderator: "Người kiểm duyệt",
  creator: "Người tạo",
  premium: "Người dùng cao cấp",
  user: "Người dùng"
};

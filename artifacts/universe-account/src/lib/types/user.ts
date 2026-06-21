export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  title: string;
  createdAt: string;
  lastLogin: string;
  role: Role;
  permissions: Permission[];
  twoFactorEnabled: boolean;
  securityScore: number;
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

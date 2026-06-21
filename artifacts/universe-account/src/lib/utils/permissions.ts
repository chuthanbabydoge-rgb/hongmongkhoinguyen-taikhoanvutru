import { Role, Permission } from "../types/user";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "read:content", "write:content", "delete:content", 
    "manage:users", "manage:roles", "view:analytics", 
    "manage:settings", "access:api"
  ],
  moderator: [
    "read:content", "write:content", "delete:content", 
    "manage:users", "view:analytics"
  ],
  creator: [
    "read:content", "write:content", "view:analytics"
  ],
  premium: [
    "read:content", "write:content"
  ],
  user: [
    "read:content"
  ]
};

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

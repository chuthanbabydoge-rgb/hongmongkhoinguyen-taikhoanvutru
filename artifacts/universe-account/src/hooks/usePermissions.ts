import { useAuth } from "./useAuth";
import { Permission } from "../lib/types/user";
import { hasPermission } from "../lib/utils/permissions";

export function usePermissions() {
  const { user } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const canAll = (...permissions: Permission[]): boolean => {
    return permissions.every(p => can(p));
  };

  const canAny = (...permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
  };

  return { can, canAll, canAny, role: user?.role, permissions: user?.permissions ?? [] };
}

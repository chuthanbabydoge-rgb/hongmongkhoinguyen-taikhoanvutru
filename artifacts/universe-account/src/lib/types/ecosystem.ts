export type ModuleId =
  | "world_creator"
  | "football_universe"
  | "animal_evolution"
  | "safepass"
  | "exchange_hub";

export type ModuleStatus = "connected" | "disconnected" | "pending" | "degraded" | "maintenance";

export type PermissionScope =
  | "read"
  | "write"
  | "delete"
  | "admin"
  | "trade"
  | "publish"
  | "stream"
  | "verify"
  | "transfer";

export interface ModulePermission {
  scope: PermissionScope;
  label: string;
  granted: boolean;
}

export interface ModuleStat {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export interface ModuleApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  status: "stable" | "beta" | "planned";
}

export interface EcosystemModule {
  id: ModuleId;
  name: string;
  tagline: string;
  description: string;
  version: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  gradientFrom: string;
  gradientTo: string;
  status: ModuleStatus;
  lastAccessed: string | null;
  connectedAt: string | null;
  permissions: ModulePermission[];
  stats: ModuleStat[];
  apiEndpoints: ModuleApiEndpoint[];
  uptime: number;
  latencyMs: number;
}

import { EcosystemModule, ModuleId, ModuleStatus } from "../types/ecosystem";
import { ECOSYSTEM_MODULES } from "../mock/ecosystemMock";

const STORAGE_KEY = "universe_ecosystem_modules";

function loadModules(): EcosystemModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Record<ModuleId, Partial<EcosystemModule>>>;
      return ECOSYSTEM_MODULES.map(m => ({ ...m, ...(saved[m.id] ?? {}) }));
    }
  } catch {}
  return ECOSYSTEM_MODULES.map(m => ({ ...m }));
}

function saveModules(modules: EcosystemModule[]) {
  try {
    const patch: Partial<Record<ModuleId, Partial<EcosystemModule>>> = {};
    modules.forEach(m => {
      patch[m.id] = { status: m.status, lastAccessed: m.lastAccessed, connectedAt: m.connectedAt, permissions: m.permissions };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
  } catch {}
}

let _modules: EcosystemModule[] = loadModules();
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach(fn => fn());
}

export const ecosystemStore = {
  getModules(): EcosystemModule[] {
    return _modules;
  },

  connect(id: ModuleId): void {
    _modules = _modules.map(m =>
      m.id === id
        ? { ...m, status: "connected" as ModuleStatus, connectedAt: new Date().toISOString(), lastAccessed: new Date().toISOString() }
        : m
    );
    saveModules(_modules);
    notify();
  },

  disconnect(id: ModuleId): void {
    _modules = _modules.map(m =>
      m.id === id ? { ...m, status: "disconnected" as ModuleStatus, connectedAt: null } : m
    );
    saveModules(_modules);
    notify();
  },

  access(id: ModuleId): void {
    _modules = _modules.map(m =>
      m.id === id ? { ...m, lastAccessed: new Date().toISOString() } : m
    );
    saveModules(_modules);
    notify();
  },

  togglePermission(id: ModuleId, scope: string): void {
    _modules = _modules.map(m =>
      m.id === id
        ? {
            ...m,
            permissions: m.permissions.map(p =>
              p.scope === scope ? { ...p, granted: !p.granted } : p
            ),
          }
        : m
    );
    saveModules(_modules);
    notify();
  },

  subscribe(fn: () => void): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

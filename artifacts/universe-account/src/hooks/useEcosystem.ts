import { useState, useEffect, useCallback } from "react";
import { ecosystemStore } from "@/lib/store/ecosystemStore";
import { EcosystemModule, ModuleId } from "@/lib/types/ecosystem";

export function useEcosystem() {
  const [modules, setModules] = useState<EcosystemModule[]>(() => ecosystemStore.getModules());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    return ecosystemStore.subscribe(() => setModules(ecosystemStore.getModules()));
  }, []);

  const connect = useCallback(async (id: ModuleId) => {
    setLoadingId(`connect:${id}`);
    await new Promise(r => setTimeout(r, 900));
    ecosystemStore.connect(id);
    setLoadingId(null);
  }, []);

  const disconnect = useCallback(async (id: ModuleId) => {
    setLoadingId(`disconnect:${id}`);
    await new Promise(r => setTimeout(r, 700));
    ecosystemStore.disconnect(id);
    setLoadingId(null);
  }, []);

  const accessModule = useCallback((id: ModuleId) => {
    ecosystemStore.access(id);
  }, []);

  const togglePermission = useCallback(async (id: ModuleId, scope: string) => {
    setLoadingId(`perm:${id}:${scope}`);
    await new Promise(r => setTimeout(r, 300));
    ecosystemStore.togglePermission(id, scope);
    setLoadingId(null);
  }, []);

  return { modules, loadingId, connect, disconnect, accessModule, togglePermission };
}

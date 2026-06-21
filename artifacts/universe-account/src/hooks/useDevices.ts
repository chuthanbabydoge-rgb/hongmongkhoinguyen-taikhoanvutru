import { useState, useEffect, useCallback } from "react";
import { Device } from "../lib/types/device";
import { apiGetDevices, apiToggleDeviceTrust, apiRemoveDevice, apiRegisterDevice } from "../lib/mock/mockApi";
import { useAuth } from "./useAuth";

export function useDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await apiGetDevices(user.id);
    setDevices(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const toggleTrust = useCallback(async (deviceId: string, trusted: boolean) => {
    const updated = await apiToggleDeviceTrust(deviceId, trusted);
    setDevices(prev => prev.map(d => d.id === deviceId ? updated : d));
  }, []);

  const removeDevice = useCallback(async (deviceId: string) => {
    await apiRemoveDevice(deviceId);
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  }, []);

  const registerDevice = useCallback(async () => {
    if (!user) return;
    const device = await apiRegisterDevice(user.id);
    setDevices(prev => [...prev, device]);
    return device;
  }, [user]);

  return { devices, isLoading, toggleTrust, removeDevice, registerDevice, refresh: fetchDevices };
}

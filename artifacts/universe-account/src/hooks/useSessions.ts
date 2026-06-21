import { useState, useEffect, useCallback } from "react";
import { Session } from "../lib/types/session";
import { apiGetSessions, apiRevokeSession, apiRevokeAllSessions } from "../lib/mock/mockApi";
import { useAuth } from "./useAuth";

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await apiGetSessions(user.id);
    setSessions(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const revokeSession = useCallback(async (sessionId: string) => {
    await apiRevokeSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const revokeAll = useCallback(async () => {
    if (!user) return;
    const current = sessions.find(s => s.isCurrent);
    await apiRevokeAllSessions(user.id, current?.id ?? "");
    setSessions(prev => prev.filter(s => s.isCurrent));
  }, [user, sessions]);

  return { sessions, isLoading, revokeSession, revokeAll, refresh: fetchSessions };
}

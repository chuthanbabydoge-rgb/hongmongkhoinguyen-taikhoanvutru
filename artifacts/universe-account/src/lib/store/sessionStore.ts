import { Session } from "../types/session";

const KEY = "universe_active_session_id";

export const sessionStore = {
  getCurrentSessionId(): string | null {
    return localStorage.getItem(KEY);
  },
  setCurrentSessionId(id: string) {
    localStorage.setItem(KEY, id);
  },
  clear() {
    localStorage.removeItem(KEY);
  }
};

export function isCurrentSession(session: Session): boolean {
  return session.isCurrent;
}

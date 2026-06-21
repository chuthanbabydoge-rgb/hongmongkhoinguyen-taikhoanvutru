import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "../lib/types/user";
import { authStore } from "../lib/store/authStore";
import { apiLogin, apiRegister, apiGetCurrentUser } from "../lib/mock/mockApi";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authStore.getUser());
  const [token, setToken] = useState<string | null>(authStore.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = authStore.getToken();
    if (storedToken) {
      apiGetCurrentUser(storedToken)
        .then(u => {
          setUser(u);
          authStore.setUser(u);
          setToken(storedToken);
        })
        .catch(() => {
          authStore.clear();
          setUser(null);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    authStore.setToken(result.token);
    authStore.setUser(result.user);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
  }, []);

  const logout = useCallback(() => {
    authStore.clear();
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = authStore.getToken();
    if (!storedToken) return;
    const u = await apiGetCurrentUser(storedToken);
    authStore.setUser(u);
    setUser(u);
  }, []);

  const updateUser = useCallback((u: User) => {
    authStore.setUser(u);
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, register, logout, refreshUser, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

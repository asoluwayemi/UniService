import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { httpClient } from './httpClient';
import { setAccessToken } from './tokenStore';
import type { CurrentUser, LoginResponse } from '../features/auth/types';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const response = await httpClient.get<CurrentUser>('/api/auth/me');
    // Normalize to ensure roles and permissions are always arrays
    const data = response.data;
    setUser({
      ...data,
      roles: Array.isArray(data.roles) ? data.roles : [],
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    });
  }, []);

  useEffect(() => {
    // No access token exists yet on first load; if a valid refresh cookie is present,
    // the response interceptor's 401 -> refresh -> retry flow silently signs the user back in.
    fetchCurrentUser()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await httpClient.post<LoginResponse>('/api/auth/login', { username, password });
      setAccessToken(response.data.accessToken);
      await fetchCurrentUser();
    },
    [fetchCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      await httpClient.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const hasRole = useCallback((role: string) => (user?.roles ?? []).includes(role), [user]);
  const hasPermission = useCallback(
    (permission: string) => (user?.permissions ?? []).includes(permission),
    [user],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, hasRole, hasPermission, refreshUser: fetchCurrentUser }),
    [user, isLoading, login, logout, hasRole, hasPermission, fetchCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

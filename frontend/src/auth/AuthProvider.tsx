import { useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authApi } from '../api/auth';
import { authStorage, notifyAuthChange } from '../api/client';
import type { UserDto } from '../api/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadUser = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setInitialized(true);
      return;
    }

    setLoading(true);
    try {
      const u = await authApi.getCurrentUser();
      setUser(u);
    } catch {
      authStorage.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      authStorage.setToken(response.token);
      setUser(response.user);
    },
    []
  );

  const logout = useCallback(() => {
    authStorage.setToken(null);
    setUser(null);
    notifyAuthChange();
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, initialized, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

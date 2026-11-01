import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setAuthLostHandler, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server whether the HttpOnly refresh cookie still represents a valid session.
  useEffect(() => {
    let alive = true;
    authService
      .restore()
      .then((u) => alive && setUser(u))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setAuthLostHandler(() => {
      setUser(null);
      toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
    });
    return () => setAuthLostHandler(null);
  }, []);

  const login = useCallback(async (payload) => { const u = await authService.login(payload); setUser(u); return u; }, []);
  const register = useCallback(async (payload) => { const u = await authService.register(payload); setUser(u); return u; }, []);
  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { tokenStore.set(null); }
    setUser(null);
  }, []);
  const changePassword = useCallback(async (payload) => { const u = await authService.changePassword(payload); setUser(u); }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'ADMIN', isAuthenticated: !!user, login, register, logout, setUser, changePassword }),
    [user, loading, login, register, logout, changePassword]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

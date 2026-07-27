import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, getAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap the session: if we hold a token (or a refresh cookie), fetch
  // the current user. The api layer will silently refresh a stale token.
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        // If no access token but a refresh cookie may exist, try a refresh.
        if (!getAccessToken()) {
          try {
            const r = await api.post('/auth/refresh');
            setAccessToken(r.data.accessToken);
          } catch {
            /* no valid session — land as a guest */
          }
        }
        if (getAccessToken()) {
          const res = await api.get('/users/me');
          if (active) setUser(res.data.user);
        }
      } catch {
        setAccessToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  // Hard logout requested by the api interceptor (refresh failed).
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener('smartcare:logout', onLogout);
    return () => window.removeEventListener('smartcare:logout', onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  // Lets pages (e.g. profile edit) push fresh user data into context.
  const refreshUser = useCallback(async () => {
    const res = await api.get('/users/me');
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = { user, setUser, loading, login, register, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

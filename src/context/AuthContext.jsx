// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { tokenStorage, getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStorage.getUser());
  const [loading, setLoading] = useState(true);

  // Vérifier la session au démarrage
  useEffect(() => {
    const boot = async () => {
      const token = tokenStorage.getAccess();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: u } = await authApi.me();
        setUser(u);
        tokenStorage.set({ user: u });
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────
  const login = useCallback(async ({ phone, password }) => {
    try {
      const data = await authApi.login({ phone, password });
      tokenStorage.set({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: data.user,
      });
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err, 'Erreur de connexion') };
    }
  }, []);

  // ─────────────────────────────────────────────
  // Register (public)
  // ─────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    try {
      const data = await authApi.register(payload);
      tokenStorage.set({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: data.user,
      });
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err, 'Erreur d\'inscription') };
    }
  }, []);

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (_) {
      // ignore
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  // ─────────────────────────────────────────────
  // Mise à jour du profil
  // ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      tokenStorage.set({ user: u });
      return u;
    } catch {
      return null;
    }
  }, []);

  // ─────────────────────────────────────────────
  // Helpers rôles
  // ─────────────────────────────────────────────
  const hasRole = useCallback(
    (...roles) => user && roles.includes(user.role),
    [user]
  );
  const isAdmin = user?.role === 'admin';
  const isGerant = user?.role === 'gerant';
  const isAgent = user?.role === 'agent';

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    isGerant,
    isAgent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
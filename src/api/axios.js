// frontend/src/api/axios.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

// ─────────────────────────────────────────────
// Stockage des tokens (localStorage)
// ─────────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => localStorage.getItem('khamis_access_token'),
  getRefresh: () => localStorage.getItem('khamis_refresh_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('khamis_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  set: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem('khamis_access_token', accessToken);
    if (refreshToken) localStorage.setItem('khamis_refresh_token', refreshToken);
    if (user) localStorage.setItem('khamis_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('khamis_access_token');
    localStorage.removeItem('khamis_refresh_token');
    localStorage.removeItem('khamis_user');
  },
};

// ─────────────────────────────────────────────
// Instance axios
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────
// Intercepteur requête : injecte le Bearer token
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Intercepteur réponse : gère 401 → refresh auto
// ─────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas boucler sur le refresh lui-même
    if (originalRequest.url?.includes(`${API_URL}/auth/refresh`)) {
      return Promise.reject(error);
    }

    // Token expiré → tentative de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // File d'attente
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) throw new Error('Pas de refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefresh } = data.tokens;
        tokenStorage.set({ accessToken, refreshToken: newRefresh });

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        // Redirection vers login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Extracteur d'erreur standardisé
// ─────────────────────────────────────────────
export function getErrorMessage(error, fallback = 'Une erreur est survenue') {
  if (!error) return fallback;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    return error.response.data.details.map((d) => d.message).join(' • ');
  }
  if (error.message) return error.message;
  return fallback;
}

export default api;
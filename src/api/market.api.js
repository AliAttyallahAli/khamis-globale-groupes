// frontend/src/api/market.api.js
import api from './axios';

export const marketApi = {
  // ─────────────────────────────────────────────
  // Catalogue public
  // ─────────────────────────────────────────────
  produits: (params) => api.get('/market/produits', { params }).then((r) => r.data),

  produit: (id) => api.get(`/market/produits/${id}`).then((r) => r.data),

  categories: () => api.get('/market/categories').then((r) => r.data),

  boutiques: () => api.get('/market/boutiques').then((r) => r.data),

  stats: () => api.get('/market/stats').then((r) => r.data),

  // ─────────────────────────────────────────────
  // Commander un produit (auth requise)
  // ─────────────────────────────────────────────
  commander: (payload) => api.post('/market/commander', payload).then((r) => r.data),
};
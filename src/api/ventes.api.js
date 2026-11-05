// frontend/src/api/ventes.api.js
import api from './axios';

export const ventesApi = {
  // ─────────────────────────────────────────────
  // Liste des ventes globales
  // ─────────────────────────────────────────────
  list: (params) => api.get('/ventes', { params }).then((r) => r.data),

  // ✅ NOUVELLE MÉTHODE : liste ligne par ligne (format tableau détaillé)
  lignes: (params) => api.get('/ventes/lignes', { params }).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Détail d'une vente
  // ─────────────────────────────────────────────
  get: (id) => api.get(`/ventes/${id}`).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Statistiques
  // ─────────────────────────────────────────────
  statsGlobal: (params) => api.get('/ventes/stats/global', { params }).then((r) => r.data),
  statsProducts: (params) => api.get('/ventes/stats/products', { params }).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Vente manuelle
  // ─────────────────────────────────────────────
  createManuel: (payload) => api.post('/ventes/manuel', payload).then((r) => r.data),
};
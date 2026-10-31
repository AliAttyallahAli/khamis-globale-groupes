// frontend/src/api/agent.api.js
import api from './axios';

export const agentApi = {
  // Mes ventes paginées
  ventes: (params) => api.get('/agent/me/ventes', { params }).then((r) => r.data),

  // Détail d'une vente
  vente: (id) => api.get(`/agent/me/ventes/${id}`).then((r) => r.data),

  // Statistiques agrégées
  stats: (params) => api.get('/agent/me/stats', { params }).then((r) => r.data),
};
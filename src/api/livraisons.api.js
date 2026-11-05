// frontend/src/api/livraisons.api.js
import api from './axios';

export const livraisonsApi = {
  list: (params) => api.get('/livraisons', { params }).then((r) => r.data),
  get: (id) => api.get(`/livraisons/${id}`).then((r) => r.data),
  updateStatut: (id, payload) => api.patch(`/livraisons/${id}/statut`, payload).then((r) => r.data),
};
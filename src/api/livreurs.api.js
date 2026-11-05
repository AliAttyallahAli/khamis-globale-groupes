// frontend/src/api/livreurs.api.js
import api from './axios';

export const livreursApi = {
  list: (params) => api.get('/livreurs', { params }).then((r) => r.data),
  get: (id) => api.get(`/livreurs/${id}`).then((r) => r.data),
  actifs: () => api.get('/livreurs/actifs').then((r) => r.data),
  create: (payload) => api.post('/livreurs', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/livreurs/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/livreurs/${id}`).then((r) => r.data),
};
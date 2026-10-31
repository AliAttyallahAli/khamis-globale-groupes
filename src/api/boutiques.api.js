// frontend/src/api/boutiques.api.js
import api from './axios';
export const boutiquesApi = {
  list: (params) => api.get('/boutiques', { params }).then((r) => r.data),
  get: (id) => api.get(`/boutiques/${id}`).then((r) => r.data),
  create: (payload) => api.post('/boutiques', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/boutiques/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/boutiques/${id}`).then((r) => r.data),
  stats: (id, params) => api.get(`/boutiques/${id}/stats`, { params }).then((r) => r.data),
};
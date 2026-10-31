// frontend/src/api/paiements.api.js
import api from './axios';

export const paiementsApi = {
  list: (params) => api.get('/paiements', { params }).then((r) => r.data),
  create: (formData) => api.post('/paiements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data),
  delete: (id) => api.delete(`/paiements/${id}`).then((r) => r.data),
  stats: (params) => api.get('/paiements/stats/summary', { params }).then((r) => r.data),
};
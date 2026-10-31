// frontend/src/api/charges.api.js
import api from './axios';

export const chargesApi = {
  list: (params) => api.get('/charges', { params }).then((r) => r.data),
  get: (id) => api.get(`/charges/${id}`).then((r) => r.data),
  create: (formData) => api.post('/charges', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data),
  valider: (id) => api.put(`/charges/${id}/valider`).then((r) => r.data),
  rejeter: (id, motif) => api.put(`/charges/${id}/rejeter`, { motif }).then((r) => r.data),
  delete: (id) => api.delete(`/charges/${id}`).then((r) => r.data),
  stats: (params) => api.get('/charges/stats/summary', { params }).then((r) => r.data),
};
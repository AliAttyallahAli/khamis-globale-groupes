// frontend/src/api/departements.api.js
import api from './axios';
export const departementsApi = {
  list: (params) => api.get('/departements', { params }).then((r) => r.data),
  get: (id) => api.get(`/departements/${id}`).then((r) => r.data),
  create: (payload) => api.post('/departements', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/departements/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/departements/${id}`).then((r) => r.data),
};
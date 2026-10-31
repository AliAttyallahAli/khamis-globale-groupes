// frontend/src/api/help.api.js
import api from './axios';

export const helpApi = {
  // Public — tous les rôles
  resources: (params) => api.get('/help/resources', { params }).then((r) => r.data),

  // Admin — gestion
  create: (formData) =>
    api.post('/help/resources', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  update: (id, formData) =>
    api.put(`/help/resources/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  delete: (id) => api.delete(`/help/resources/${id}`).then((r) => r.data),
};
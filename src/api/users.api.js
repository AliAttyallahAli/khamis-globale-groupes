// frontend/src/api/users.api.js
import api from './axios';

export const usersApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  forSelect: (params) => api.get('/users/for-select', { params }).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`).then((r) => r.data),
  resetPassword: (id, payload) => api.post(`/users/${id}/reset-password`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/users/${id}`).then((r) => r.data),
  stats: () => api.get('/users/stats/overview').then((r) => r.data),
};

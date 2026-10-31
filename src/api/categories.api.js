// frontend/src/api/categories.api.js
import api from './axios';
export const categoriesApi = {
  list: (params) => api.get('/categories', { params }).then((r) => r.data),
  get: (id) => api.get(`/categories/${id}`).then((r) => r.data),
  create: (payload) => api.post('/categories', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
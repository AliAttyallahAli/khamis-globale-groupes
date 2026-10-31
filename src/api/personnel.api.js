// frontend/src/api/personnel.api.js
import api from './axios';

export const personnelApi = {
  list: (params) => api.get('/personnel', { params }).then((r) => r.data),
  get: (id) => api.get(`/personnel/${id}`).then((r) => r.data),
  create: (payload) => api.post('/personnel', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/personnel/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/personnel/${id}`).then((r) => r.data),
};
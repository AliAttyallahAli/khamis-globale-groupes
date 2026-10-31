// frontend/src/api/admin-agents.api.js
import api from './axios';

export const adminAgentsApi = {
  list: (params) => api.get('/admin/agents', { params }).then((r) => r.data),
  get: (id) => api.get(`/admin/agents/${id}`).then((r) => r.data),
  toggleActive: (id) =>
    api.patch(`/admin/agents/${id}/toggle-active`).then((r) => r.data),
};
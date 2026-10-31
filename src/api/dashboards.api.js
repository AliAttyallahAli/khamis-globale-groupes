// frontend/src/api/dashboards.api.js
import api from './axios';

export const dashboardsApi = {
  admin: (params) => api.get('/dashboards/admin', { params }).then((r) => r.data),
  gerant: (params) => api.get('/dashboards/gerant', { params }).then((r) => r.data),
  agent: (params) => api.get('/dashboards/agent', { params }).then((r) => r.data),
  user: () => api.get('/dashboards/user').then((r) => r.data),
};
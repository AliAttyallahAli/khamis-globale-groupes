// frontend/src/api/notifications.api.js
import api from './axios';
export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/notifications/read-all').then((r) => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};
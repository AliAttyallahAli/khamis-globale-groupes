// frontend/src/api/commandes.api.js
import api from './axios';

export const commandesApi = {
  list: (params) => api.get('/commandes', { params }).then((r) => r.data),
  get: (id) => api.get(`/commandes/${id}`).then((r) => r.data),
  create: (payload) => api.post('/commandes', payload).then((r) => r.data),
  valider: (id) => api.put(`/commandes/${id}/valider`).then((r) => r.data),
  rejeter: (id, motif) => api.put(`/commandes/${id}/rejeter`, { motif }).then((r) => r.data),
  livrer: (id) => api.put(`/commandes/${id}/livrer`).then((r) => r.data),
};
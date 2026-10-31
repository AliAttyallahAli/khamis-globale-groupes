// frontend/src/api/ventes.api.js
import api from './axios';

export const ventesApi = {
  list: (params) => api.get('/ventes', { params }).then((r) => r.data),
  get: (id) => api.get(`/ventes/${id}`).then((r) => r.data),
  statsGlobal: (params) => api.get('/ventes/stats/global', { params }).then((r) => r.data),
  statsProducts: (params) => api.get('/ventes/stats/products', { params }).then((r) => r.data),
  createManuel: (payload) => api.post('/ventes/manuel', payload).then((r) => r.data),
};
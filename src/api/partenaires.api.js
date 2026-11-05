import api from './axios';

export const partenairesApi = {
  list: (params) => api.get('/partenaires', { params }).then((r) => r.data),   // ← LIST
  get: (id) => api.get(`/partenaires/${id}`).then((r) => r.data),               // ← GET (détail)
  options: () => api.get('/partenaires/options').then((r) => r.data),
  stats: () => api.get('/partenaires/stats').then((r) => r.data),
  create: (payload) => api.post('/partenaires', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/partenaires/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/partenaires/${id}`).then((r) => r.data),
  createAchat: (id, payload) => api.post(`/partenaires/${id}/achats`, payload).then((r) => r.data),
};
// frontend/src/api/alkherpay.api.js
import api from './axios';

export const alkherpayApi = {
  solde: () => api.get('/khamis/paiements/solde').then((r) => r.data),
  transfert: (payload) => api.post('/khamis/paiements/transfert', payload).then((r) => r.data),
  depot: (payload) => api.post('/khamis/paiements/depot', payload).then((r) => r.data),
  retrait: (payload) => api.post('/khamis/paiements/retrait', payload).then((r) => r.data),
  historique: (params) => api.get('/khamis/paiements/historique', { params }).then((r) => r.data),

  // ✅ NOUVEAU : Gestion PIN
  pinStatus: () => api.get('/khamis/paiements/pin-status').then((r) => r.data),
  setPin: (payload) => api.post('/khamis/paiements/set-pin', payload).then((r) => r.data),
  verifyPin: (payload) => api.post('/khamis/paiements/verify-pin', payload).then((r) => r.data),
};
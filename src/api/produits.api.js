// frontend/src/api/produits.api.js
import api from './axios';

export const produitsApi = {
  // ─────────────────────────────────────────────
  // Liste paginée + filtres
  // ─────────────────────────────────────────────
  list: (params) => api.get('/produits', { params }).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Détail d'un produit (avec images + stats)
  // ─────────────────────────────────────────────
  get: (id) => api.get(`/produits/${id}`).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Création avec images (multipart)
  // Usage : produitsApi.createMultipart(formData)
  // ─────────────────────────────────────────────
  createMultipart: (formData) =>
    api
      .post('/produits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // ─────────────────────────────────────────────
  // Mise à jour (JSON, sans images)
  // ─────────────────────────────────────────────
  update: (id, payload) =>
    api.put(`/produits/${id}`, payload).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Ajouter des images à un produit existant (multipart)
  // ─────────────────────────────────────────────
  addImages: (id, formData) =>
    api
      .post(`/produits/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // ─────────────────────────────────────────────
  // Supprimer une image
  // ─────────────────────────────────────────────
  deleteImage: (produitId, imageId) =>
    api.delete(`/produits/${produitId}/images/${imageId}`).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Définir une image comme principale
  // ─────────────────────────────────────────────
  setPrimaryImage: (produitId, imageId) =>
    api
      .patch(`/produits/${produitId}/images/${imageId}/primary`)
      .then((r) => r.data),

  // ─────────────────────────────────────────────
  // Ajuster le stock
  // ─────────────────────────────────────────────
  adjustStock: (id, payload) =>
    api.patch(`/produits/${id}/stock`, payload).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Désactiver un produit
  // ─────────────────────────────────────────────
  delete: (id) => api.delete(`/produits/${id}`).then((r) => r.data),

  // ─────────────────────────────────────────────
  // Produits en alerte de stock
  // ─────────────────────────────────────────────
  alertes: () => api.get('/produits/alertes/stock-bas').then((r) => r.data),
};
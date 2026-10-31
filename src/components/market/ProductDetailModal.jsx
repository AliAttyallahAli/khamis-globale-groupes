// frontend/src/components/market/ProductDetailModal.jsx
import { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ImageGallery from '../forms/ImageGallery';
import { formatCFA } from '../../utils/formatters';
import { marketApi } from '../../api/market.api';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetailModal({ open, produitId, onClose }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open || !produitId) return;
    setLoading(true);
    setProduit(null);
    setQuantite(1);
    setNotes('');
    setSuccess(false);
    marketApi
      .produit(produitId)
      .then((r) => setProduit(r.produit))
      .catch((err) => toast.error(err.response?.data?.error || 'Erreur'))
      .finally(() => setLoading(false));
  }, [open, produitId]);

  const handleCommander = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour commander');
      // Sauvegarder l'intention pour rediriger après login
      localStorage.setItem('redirect_after_login', `/market?produit=${produitId}`);
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await marketApi.commander({
        produit_id: produitId,
        quantite,
        notes: notes || undefined,
      });
      toast.success(res.message || 'Commande enregistrée');
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  const stockDispo = produit?.stock || 0;
  const canOrder = stockDispo > 0 && !success;
  const total = (produit?.prix_vente || 0) * quantite;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={produit?.name || 'Détail du produit'}
      size="lg"
    >
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 size={32} className="text-brand-500 animate-spin" />
        </div>
      ) : produit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galerie */}
          <div>
            <ImageGallery images={produit.images || []} alt={produit.name} />
          </div>

          {/* Infos + commande */}
          <div className="space-y-4">
            <div>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${produit.category_color}20`,
                  color: produit.category_color,
                }}
              >
                {produit.category_name}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">
                {produit.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                📍 {produit.boutique_name}
                {produit.boutique_address && ` — ${produit.boutique_address}`}
              </p>
            </div>

            {produit.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {produit.description}
              </p>
            )}

            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
              <p className="text-xs text-brand-600 font-medium uppercase tracking-wider">
                Prix unitaire
              </p>
              <p className="text-3xl font-bold text-brand-700 mt-1">
                {formatCFA(produit.prix_vente)}
              </p>
              <p className={`text-xs mt-1 ${stockDispo <= 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {stockDispo <= 0
                  ? '❌ Rupture de stock'
                  : `${stockDispo} unité(s) disponible(s)`}
              </p>
            </div>

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800">Commande enregistrée !</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Votre commande est en attente de validation par le gérant.
                      Vous recevrez une notification dès qu'elle sera traitée.
                    </p>
                    <button
                      onClick={() => navigate('/commandes')}
                      className="text-sm text-emerald-600 hover:underline mt-2 font-medium"
                    >
                      Voir mes commandes →
                    </button>
                  </div>
                </div>
              </div>
            ) : canOrder ? (
              <>
                {/* Quantité */}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Quantité
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setQuantite(Math.max(1, quantite - 1))}
                      className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={stockDispo}
                      value={quantite}
                      onChange={(e) =>
                        setQuantite(Math.min(stockDispo, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="w-20 text-center px-3 py-2 rounded-lg border border-slate-300 font-semibold text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantite(Math.min(stockDispo, quantite + 1))}
                      className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Notes <span className="text-slate-400 text-xs">(optionnel)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Instructions spéciales pour cette commande..."
                    maxLength={500}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                {/* Total */}
                <div className="p-4 rounded-xl bg-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total</span>
                  <span className="text-2xl font-bold text-slate-800">
                    {formatCFA(total)}
                  </span>
                </div>

                <Button
                  onClick={handleCommander}
                  loading={submitting}
                  className="w-full py-3"
                >
                  <ShoppingCart size={18} />
                  {isAuthenticated ? 'Commander maintenant' : 'Se connecter pour commander'}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-slate-500">
                    Vous devez être connecté pour passer commande
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
// frontend/src/pages/Livraisons.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Truck, Search, X, Eye, CheckCircle2, XCircle, Clock,
  MapPin, User, Phone, Filter, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { livraisonsApi } from '../api/livraisons.api';
import { livreursApi } from '../api/livreurs.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate, formatDateTime } from '../utils/formatters';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/data/Pagination';
import FilterBar from '../components/data/FilterBar';

const STATUTS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'livree', label: 'Livrées' },
  { value: 'echouee', label: 'Échouées' },
  { value: 'annulee', label: 'Annulées' },
];

const STATUT_COLORS = {
  en_cours: 'amber',
  livree: 'emerald',
  echouee: 'red',
  annulee: 'slate',
};

const STATUT_LABELS = {
  en_cours: 'En cours',
  livree: 'Livrée',
  echouee: 'Échouée',
  annulee: 'Annulée',
};

export default function Livraisons() {
  const { isAdmin, user } = useAuth();
  const canEdit = ['admin', 'gerant'].includes(user?.role);

  const [livraisons, setLivraisons] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('all');
  const [livreurId, setLivreurId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Modal détail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal statut
  const [statusModal, setStatusModal] = useState(null);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchLivraisons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await livraisonsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        statut,
        livreur_id: livreurId || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLivraisons(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur chargement livraisons');
    } finally {
      setLoading(false);
    }
  }, [page, search, statut, livreurId, from, to]);

  useEffect(() => { fetchLivraisons(); }, [fetchLivraisons]);

  // Charger la liste des livreurs pour le filtre
  useEffect(() => {
    livreursApi.list({ limit: 200, is_active: 'all' })
      .then((d) => setLivreurs(d.data || []))
      .catch(console.warn);
  }, []);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const openDetail = async (livraison) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await livraisonsApi.get(livraison.id);
      setDetail(res.livraison);
    } catch (err) {
      toast.error('Erreur chargement détail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatut = async (livraisonId, newStatut) => {
    setUpdating(true);
    try {
      await livraisonsApi.updateStatut(livraisonId, {
        statut: newStatut,
        raison: newStatut === 'echouee' ? reason : undefined,
      });
      toast.success(`Livraison ${newStatut === 'livree' ? 'livrée' : 'échouée'}`);
      setStatusModal(null);
      setReason('');
      fetchLivraisons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatut('all');
    setLivreurId('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasActiveFilters = search || statut !== 'all' || livreurId || from || to;

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Truck className="text-brand-500" /> Livraisons
        </h1>
        <p className="text-sm text-slate-500">
          {total} livraison(s) au total
        </p>
      </div>

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={resetFilters}
      >
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={livreurId}
          onChange={(e) => { setLivreurId(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">Tous les livreurs</option>
          {livreurs.map((l) => (
            <option key={l.id} value={l.id}>{l.fullname}</option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Du"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Au"
        />
      </FilterBar>

      {/* Liste */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : livraisons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12">
          <EmptyState
            title="Aucune livraison"
            message={hasActiveFilters
              ? 'Modifiez vos filtres pour voir plus de résultats'
              : 'Les livraisons apparaîtront ici après validation des commandes'}
            icon={Truck}
          />
          {hasActiveFilters && (
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {livraisons.map((livraison) => (
            <div
              key={livraison.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Icône */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${livraison.statut === 'livree' ? 'bg-emerald-100' :
                    livraison.statut === 'en_cours' ? 'bg-amber-100' :
                    livraison.statut === 'echouee' ? 'bg-red-100' : 'bg-slate-100'}`}
                >
                  <Truck
                    size={20}
                    className={
                      livraison.statut === 'livree' ? 'text-emerald-600' :
                      livraison.statut === 'en_cours' ? 'text-amber-600' :
                      livraison.statut === 'echouee' ? 'text-red-600' : 'text-slate-500'
                    }
                  />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-800">
                      {livraison.reference}
                    </span>
                    <Badge color={STATUT_COLORS[livraison.statut]}>
                      {STATUT_LABELS[livraison.statut]}
                    </Badge>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{livraison.adresse}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <User size={12} className="flex-shrink-0" />
                      <span className="truncate">
                        {livraison.livreur_name} ({livraison.livreur_vehicle})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span>{formatDateTime(livraison.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>Commande : <span className="font-mono">{livraison.commande_ref}</span></span>
                    <span>•</span>
                    <span>{livraison.boutique_name}</span>
                    {livraison.frais > 0 && (
                      <>
                        <span>•</span>
                        <span>Frais : {formatCFA(livraison.frais)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openDetail(livraison)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                    title="Voir détail"
                  >
                    <Eye size={14} />
                  </button>

                  {canEdit && livraison.statut === 'en_cours' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatut(livraison.id, 'livree')}
                        className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                        title="Marquer livrée"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => { setStatusModal(livraison); setReason(''); }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        title="Marquer échouée"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* ═══════ MODAL DÉTAIL ═══════ */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetail(null); }}
        title="Détail de la livraison"
        size="md"
      >
        {detailLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Référence</p>
                <p className="font-mono font-semibold">{detail.reference}</p>
              </div>
              <Badge color={STATUT_COLORS[detail.statut]}>
                {STATUT_LABELS[detail.statut]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Commande</p>
                <p className="font-mono text-sm">{detail.commande_ref}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Boutique</p>
                <p className="text-sm">{detail.boutique_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Livreur</p>
                <p className="text-sm font-medium">{detail.livreur_name}</p>
                <p className="text-xs text-slate-500">{detail.livreur_phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Frais</p>
                <p className="text-sm font-semibold">{formatCFA(detail.frais || 0)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Adresse de livraison</p>
              <p className="text-sm flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                {detail.adresse}
              </p>
            </div>

            {(detail.destinataire || detail.telephone) && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Destinataire</p>
                <p className="text-sm font-medium">{detail.destinataire}</p>
                {detail.telephone && (
                  <p className="text-xs text-slate-500">{detail.telephone}</p>
                )}
              </div>
            )}

            {detail.notes && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm">{detail.notes}</p>
              </div>
            )}

            {detail.echouee_raison && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 font-medium mb-1">Raison de l'échec</p>
                <p className="text-sm text-red-800">{detail.echouee_raison}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
              <span>Créée le {formatDateTime(detail.created_at)}</span>
              {detail.livree_at && (
                <span>Livrée le {formatDateTime(detail.livree_at)}</span>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ═══════ MODAL ÉCHOUÉE ═══════ */}
      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setStatusModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-800 mb-3">Marquer la livraison comme échouée</h3>
            <p className="text-sm text-slate-500 mb-4">
              Livraison <strong>{statusModal.reference}</strong>
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700">Raison *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ex: Client absent, adresse introuvable..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setStatusModal(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => handleUpdateStatut(statusModal.id, 'echouee')}
                disabled={!reason.trim() || updating}
                loading={updating}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
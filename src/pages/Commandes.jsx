// frontend/src/pages/Commandes.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, CheckCircle2, XCircle, Eye, ShoppingCart, Truck,
  AlertTriangle, Wallet, TrendingUp, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { commandesApi } from '../api/commandes.api';
import { boutiquesApi } from '../api/boutiques.api';
import { produitsApi } from '../api/produits.api';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { formatCFA, formatDate } from '../utils/formatters';
import { STATUTS_COMMANDE } from '../utils/constants';

import { Button, Modal, Badge, Input } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { CommandeForm } from '../components/forms';

export default function Commandes() {
  const { isAgent, isGerant, isAdmin } = useRole();

  const [commandes, setCommandes] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [produitsParBoutique, setProduitsParBoutique] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modales
  const createModal = useModal();
  const detailModal = useModal();
  const validateModal = useModal();
  const deliverModal = useModal();
  const rejectModal = useModal();

  const [validating, setValidating] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [rejectMotif, setRejectMotif] = useState('');

  // Filtres + pagination
  const filters = useFilters({ statut: 'all', search: '' });
  const pag = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.values.search, 400);

  // ═══════════════════════════════════════════════
  // Charger commandes
  // ═══════════════════════════════════════════════
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
        statut: filters.values.statut,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await commandesApi.list(params);
      setCommandes(data.data || []);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, debouncedSearch, filters.values.statut]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  // ═══════════════════════════════════════════════
  // Charger boutiques à l'ouverture du modal création
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!createModal.isOpen) return;
    boutiquesApi.list({ is_active: 1, limit: 500 }).then((d) => {
      setBoutiques(d.data || []);
    }).catch(console.warn);
  }, [createModal.isOpen]);

  // ═══════════════════════════════════════════════
  // Charger produits à la sélection d'une boutique
  // ═══════════════════════════════════════════════
  const handleBoutiqueChange = useCallback(async (boutiqueId) => {
    if (!boutiqueId || produitsParBoutique[boutiqueId]) return;
    try {
      const data = await produitsApi.list({ boutique_id: boutiqueId, is_active: 1, limit: 500 });
      setProduitsParBoutique((p) => ({ ...p, [boutiqueId]: data.data || [] }));
    } catch (err) {
      console.warn(err);
    }
  }, [produitsParBoutique]);

  // ═══════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════
  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await commandesApi.create(payload);
      toast.success('Commande créée — en attente de validation');
      createModal.close();
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await commandesApi.valider(validateModal.data.id);
      toast.success(`✅ Commande validée ! Marge : ${formatCFA(res.marge_calculee || 0)}`, { duration: 5000 });
      validateModal.close();
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setValidating(false);
    }
  };

  const handleDeliver = async () => {
    setDelivering(true);
    try {
      await commandesApi.livrer(deliverModal.data.id);
      toast.success(`🚚 Commande livrée`);
      deliverModal.close();
      setDeliveryNote('');
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setDelivering(false);
    }
  };

  const handleReject = async () => {
    if (!rejectMotif.trim()) return toast.error('Motif requis');
    try {
      await commandesApi.rejeter(rejectModal.data.id, rejectMotif.trim());
      toast.success('Commande rejetée');
      rejectModal.close();
      setRejectMotif('');
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleOpenDetail = async (c) => {
    try {
      const data = await commandesApi.get(c.id);
      detailModal.open(data.commande);
    } catch (err) {
      toast.error('Erreur chargement détail');
    }
  };

  // ═══════════════════════════════════════════════
  // Colonnes
  // ═══════════════════════════════════════════════
  const columns = [
    { key: 'reference', label: 'Référence', render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.created_at) },
    { key: 'agent_name', label: 'Agent' },
    { key: 'boutique_name', label: 'Boutique' },
    { key: 'nb_lignes', label: 'Lignes', align: 'center' },
    {
      key: 'total_vente', label: 'Total', align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.total_vente)}</span>,
    },
    {
      key: 'marge', label: 'Marge', align: 'right',
      render: (r) => r.marge > 0
        ? <span className="text-emerald-600 font-semibold">{formatCFA(r.marge)}</span>
        : '—',
    },
    {
      key: 'statut', label: 'Statut',
      render: (r) => {
        const s = STATUTS_COMMANDE[r.statut] || { label: r.statut, color: 'slate' };
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(r); }}
            className="p-1.5 rounded hover:bg-slate-100" title="Voir détail">
            <Eye size={14} />
          </button>
          {(isGerant || isAdmin) && r.statut === 'en_attente' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); validateModal.open(r); }}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Valider">
                <CheckCircle2 size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); rejectModal.open(r); }}
                className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Rejeter">
                <XCircle size={14} />
              </button>
            </>
          )}
          {(isGerant || isAdmin) && r.statut === 'validee' && (
            <button onClick={(e) => { e.stopPropagation(); deliverModal.open(r); setDeliveryNote(''); }}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Livrer">
              <Truck size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-brand-500" /> Commandes
          </h1>
          <p className="text-sm text-slate-500">{pag.total} commande(s)</p>
        </div>
        {isAgent && (
          <Button onClick={() => createModal.open()}>
            <Plus size={16} /> Nouvelle commande
          </Button>
        )}
      </div>

      <FilterBar
        search={filters.values.search}
        onSearchChange={(v) => { filters.set('search', v); pag.setPage(1); }}
        onReset={() => { filters.reset(); pag.setPage(1); }}
      >
        <select value={filters.values.statut}
          onChange={(e) => { filters.set('statut', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validée</option>
          <option value="livree">Livrée</option>
          <option value="annulee">Annulée</option>
        </select>
      </FilterBar>

      <DataTable columns={columns} data={commandes} loading={loading} emptyTitle="Aucune commande" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      {/* MODAL CRÉATION */}
      <Modal open={createModal.isOpen} onClose={createModal.close} title="Nouvelle commande" size="lg">
        <CommandeForm
          boutiques={boutiques}
          produitsParBoutique={produitsParBoutique}
          onSubmit={handleCreate}
          onCancel={createModal.close}
          loading={saving}
          onBoutiqueChange={handleBoutiqueChange}
        />
      </Modal>

      {/* MODAL VALIDATION */}
      <Modal open={validateModal.isOpen} onClose={validateModal.close} title="Valider la commande" size="md">
        {validateModal.data && (
          <div className="space-y-4">
            <div className="alert-warning">
              <AlertTriangle size={18} />
              <div>
                <p className="font-medium">Action irréversible</p>
                <p className="text-xs mt-1">Une vente sera créée et le stock décrémenté.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Référence</span>
                <span className="font-mono font-medium">{validateModal.data.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Agent</span>
                <span className="font-medium">{validateModal.data.agent_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Boutique</span>
                <span className="font-medium">{validateModal.data.boutique_name}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1"><Wallet size={14} /> Total vente</span>
                <span className="font-semibold">{formatCFA(validateModal.data.total_vente)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1"><TrendingUp size={14} /> Marge attendue</span>
                <span className="font-bold text-emerald-600">{formatCFA(validateModal.data.marge || 0)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={validateModal.close}>Annuler</Button>
              <Button variant="success" onClick={handleValidate} loading={validating}>
                <CheckCircle2 size={16} /> Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL LIVRAISON */}
      <Modal open={deliverModal.isOpen} onClose={deliverModal.close} title="Marquer comme livrée" size="md">
        {deliverModal.data && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Truck size={32} className="text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-slate-800">Livraison</p>
              <p className="text-sm text-slate-500">{deliverModal.data.reference}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Note (optionnel)</label>
              <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                rows={2} maxLength={200}
                placeholder="Ex: Livré au client, reçu signé"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={deliverModal.close}>Annuler</Button>
              <Button onClick={handleDeliver} loading={delivering}>
                <Truck size={16} /> Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL REJET */}
      <Modal open={rejectModal.isOpen} onClose={rejectModal.close} title="Rejeter la commande" size="sm">
        <div className="space-y-3">
          <Input label="Motif *" value={rejectMotif} onChange={(e) => setRejectMotif(e.target.value)}
            placeholder="Ex: Stock non conforme" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={rejectModal.close}>Annuler</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectMotif.trim()}>Rejeter</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL DÉTAIL */}
      <Modal open={detailModal.isOpen} onClose={detailModal.close} title="Détail commande" size="lg">
        {detailModal.data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Référence :</span> <strong>{detailModal.data.reference}</strong></div>
              <div><span className="text-slate-500">Statut :</span> <Badge color={STATUTS_COMMANDE[detailModal.data.statut]?.color}>{STATUTS_COMMANDE[detailModal.data.statut]?.label}</Badge></div>
              <div><span className="text-slate-500">Agent :</span> {detailModal.data.agent_name}</div>
              <div><span className="text-slate-500">Boutique :</span> {detailModal.data.boutique_name}</div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Produit</th>
                    <th className="text-right px-3 py-2">Qté</th>
                    <th className="text-right px-3 py-2">Prix vente</th>
                    <th className="text-right px-3 py-2">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.data.lignes?.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{l.produit_name}</td>
                      <td className="px-3 py-2 text-right">{l.quantite}</td>
                      <td className="px-3 py-2 text-right">{formatCFA(l.prix_vente_applique)}</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                        {formatCFA(l.marge_calculee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
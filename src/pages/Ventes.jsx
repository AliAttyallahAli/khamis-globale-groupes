// frontend/src/pages/Ventes.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Receipt, TrendingUp, Wallet, Plus, X, Trash2,
  ShoppingCart, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ventesApi } from '../api/ventes.api';
import { boutiquesApi } from '../api/boutiques.api';
import { produitsApi } from '../api/produits.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate, formatPercent } from '../utils/formatters';

import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';
import ExportButtons from '../components/data/ExportButtons';
import KPICard from '../components/dashboard/KPICard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const EMPTY_LIGNE = { produit_id: '', quantite: 1 };

export default function Ventes() {
  const { isAdmin, user } = useAuth();
  const canSell = ['admin', 'agent', 'gerant'].includes(user?.role);

  // ─────────────────────────────────────────────
  // État liste
  // ─────────────────────────────────────────────
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [stats, setStats] = useState(null);

  // ─────────────────────────────────────────────
  // État modal vente manuelle
  // ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [boutiques, setBoutiques] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch ventes
  // ─────────────────────────────────────────────
  const fetchVentes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
      };
      const data = await ventesApi.list(params);
      setVentes(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur chargement ventes');
    } finally {
      setLoading(false);
    }
  }, [page, search, from, to]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await ventesApi.statsGlobal({ from, to });
      setStats(data.stats);
    } catch (err) {
      console.warn(err);
    }
  }, [from, to]);

  useEffect(() => {
    fetchVentes();
    fetchStats();
  }, [fetchVentes, fetchStats]);

  // ─────────────────────────────────────────────
  // Charge boutiques à l'ouverture du modal
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!modalOpen) return;
    boutiquesApi
      .list({ is_active: 1, limit: 200 })
      .then((d) => setBoutiques(d.data || []))
      .catch(console.warn);
  }, [modalOpen]);

  // ─────────────────────────────────────────────
  // Charge produits quand boutique change
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBoutique) {
      setProduits([]);
      return;
    }
    produitsApi
      .list({ boutique_id: selectedBoutique, is_active: 1, limit: 500 })
      .then((d) => setProduits(d.data || []))
      .catch(console.warn);
  }, [selectedBoutique]);

  // ─────────────────────────────────────────────
  // Gestion des lignes
  // ─────────────────────────────────────────────
  const addLigne = () => setLignes([...lignes, { ...EMPTY_LIGNE }]);
  const updateLigne = (idx, field, value) => {
    const newLignes = [...lignes];
    newLignes[idx][field] = value;
    setLignes(newLignes);
  };
  const removeLigne = (idx) => {
    if (lignes.length === 1) return;
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  // ─────────────────────────────────────────────
  // Aperçu totaux
  // ─────────────────────────────────────────────
  const totalVente = lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id, 10));
    if (!p) return sum;
    return sum + p.prix_vente * (parseInt(l.quantite, 10) || 0);
  }, 0);

  const totalPartenaire = lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id, 10));
    if (!p) return sum;
    return sum + p.prix_partenaire * (parseInt(l.quantite, 10) || 0);
  }, 0);

  const margeTotale = totalVente - totalPartenaire;

  // ─────────────────────────────────────────────
  // Ouvrir / fermer le modal
  // ─────────────────────────────────────────────
  const openModal = () => {
    setSelectedBoutique('');
    setProduits([]);
    setLignes([{ ...EMPTY_LIGNE }]);
    setClientName('');
    setClientPhone('');
    setNotes('');
    setModalOpen(true);
  };

  // ─────────────────────────────────────────────
  // Soumettre la vente manuelle
  // ─────────────────────────────────────────────
  const handleCreateVente = async (e) => {
    e.preventDefault();
    if (!selectedBoutique) return toast.error('Sélectionnez une boutique');

    const lignesValides = lignes.filter(
      (l) => l.produit_id && parseInt(l.quantite, 10) > 0
    );
    if (lignesValides.length === 0) {
      return toast.error('Ajoutez au moins un produit');
    }

    setSaving(true);
    try {
      const res = await ventesApi.createManuel({
        boutique_id: parseInt(selectedBoutique, 10),
        lignes: lignesValides.map((l) => ({
          produit_id: parseInt(l.produit_id, 10),
          quantite: parseInt(l.quantite, 10),
        })),
        client_name: clientName || undefined,
        client_phone: clientPhone || undefined,
        notes: notes || undefined,
      });

      toast.success(
        <div>
          <p className="font-semibold">Vente enregistrée ✅</p>
          <p className="text-xs">Marge : {formatCFA(res.details.total_marge)}</p>
        </div>
      );

      setModalOpen(false);
      fetchVentes();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la vente');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Colonnes
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'reference',
      label: 'Réf. vente',
      render: (r) => <span className="font-mono text-xs">{r.reference}</span>,
    },
    {
      key: 'commande_ref',
      label: 'Commande',
      render: (r) => (
        <span className="font-mono text-xs text-slate-500">{r.commande_ref}</span>
      ),
    },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.created_at) },
    { key: 'agent_name', label: 'Agent' },
    { key: 'boutique_name', label: 'Boutique' },
    {
      key: 'total_vente',
      label: 'CA',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.total_vente)}</span>,
    },
    {
      key: 'total_marge',
      label: 'Marge',
      align: 'right',
      render: (r) => (
        <span className="text-emerald-600 font-semibold">
          {formatCFA(r.total_marge)}
        </span>
      ),
    },
    {
      key: 'marge_pourcentage',
      label: '%',
      align: 'right',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {formatPercent(r.marge_pourcentage)}
        </span>
      ),
    },
  ];

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-brand-500" /> Ventes
          </h1>
          <p className="text-sm text-slate-500">
            {total} vente(s) — Marge calculée automatiquement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            endpoint="/rapports/ventes"
            params={{ from, to }}
            filenameBase="ventes"
          />
          {canSell && (
            <Button onClick={openModal}>
              <Plus size={16} /> Vendre
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="CA"
            value={formatCFA(stats.total_vente)}
            icon={TrendingUp}
            color="blue"
          />
          <KPICard
            title="Marge"
            value={formatCFA(stats.total_marge)}
            icon={Wallet}
            color="emerald"
            subtitle={formatPercent(stats.marge_pourcentage)}
          />
          <KPICard
            title="Nb ventes"
            value={stats.nb_ventes}
            icon={Receipt}
            color="violet"
          />
        </div>
      )}

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => { setSearch(''); setFrom(''); setTo(''); setPage(1); }}
      >
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        />
      </FilterBar>

      {/* Tableau */}
      <DataTable columns={columns} data={ventes} loading={loading} emptyTitle="Aucune vente" />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL VENTE MANUELLE                        */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enregistrer une vente manuelle"
        size="lg"
      >
        <form onSubmit={handleCreateVente} className="space-y-4">
          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Cette vente sera <strong>automatiquement validée</strong> et le stock
              décrémenté. Utilisez-la pour les ventes directes en boutique.
            </p>
          </div>

          {/* Boutique */}
          <Select
            label="Boutique *"
            value={selectedBoutique}
            onChange={(e) => setSelectedBoutique(e.target.value)}
            required
          >
            <option value="">— Sélectionner —</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>

          {/* Lignes produits */}
          {selectedBoutique && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Produits vendus *
                </label>
                {lignes.map((l, idx) => {
                  const produit = produits.find(
                    (p) => p.id === parseInt(l.produit_id, 10)
                  );
                  return (
                    <div key={idx} className="flex gap-2 items-start">
                      <select
                        value={l.produit_id}
                        onChange={(e) => updateLigne(idx, 'produit_id', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value="">— Produit —</option>
                        {produits.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock}) — {formatCFA(p.prix_vente)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={produit?.stock || 999}
                        value={l.quantite}
                        onChange={(e) => updateLigne(idx, 'quantite', e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLigne(idx)}
                        disabled={lignes.length === 1}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addLigne}
                  className="text-sm text-brand-500 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Ajouter une ligne
                </button>
              </div>

              {/* Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nom du client (optionnel)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
                <Input
                  label="Téléphone client (optionnel)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="8 chiffres"
                  maxLength={8}
                />
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
                  maxLength={500}
                  placeholder="Informations complémentaires..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              {/* Totaux */}
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total vente</span>
                  <span className="font-semibold text-slate-800">
                    {formatCFA(totalVente)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Coût partenaire</span>
                  <span className="text-slate-600">
                    {formatCFA(totalPartenaire)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base pt-2 border-t border-brand-200">
                  <span className="font-medium text-slate-700">Marge</span>
                  <span className="font-bold text-emerald-600">
                    {formatCFA(margeTotale)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              <CheckCircle2 size={16} />
              Enregistrer la vente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
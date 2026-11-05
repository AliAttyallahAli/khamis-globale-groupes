// frontend/src/pages/Commandes.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, CheckCircle2, XCircle, Eye, ShoppingCart, Truck,
  MapPin, User, Phone, DollarSign, FileText, AlertTriangle,
  Store, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { commandesApi } from '../api/commandes.api';
import { boutiquesApi } from '../api/boutiques.api';
import { produitsApi } from '../api/produits.api';
import { livreursApi } from '../api/livreurs.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate } from '../utils/formatters';
import { STATUTS_COMMANDE } from '../utils/constants';

import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';
import Spinner from '../components/ui/Spinner';

export default function Commandes() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';
  const isGerant = user?.role === 'gerant';
  const isAdmin = user?.role === 'admin';

  // ─────────────────────────────────────────────
  // État liste
  // ─────────────────────────────────────────────
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [statut, setStatut] = useState('all');
  const [search, setSearch] = useState('');

  // ─────────────────────────────────────────────
  // État modal création
  // ─────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [boutiques, setBoutiques] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [lignes, setLignes] = useState([{ produit_id: '', quantite: 1 }]);
  const [creating, setCreating] = useState(false);

  // ─────────────────────────────────────────────
  // État modal validation (livraison)
  // ─────────────────────────────────────────────
  const [validateOpen, setValidateOpen] = useState(false);
  const [validatingCommande, setValidatingCommande] = useState(null);
  const [livreurs, setLivreurs] = useState([]);
  const [loadingLivreurs, setLoadingLivreurs] = useState(false);
  const [validationForm, setValidationForm] = useState({
    livreur_id: '',
    adresse_livraison: '',
    destinataire: '',
    telephone_destinataire: '',
    frais_livraison: '',
    notes_livraison: '',
  });
  const [validating, setValidating] = useState(false);

  // ─────────────────────────────────────────────
  // État modal détail
  // ─────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─────────────────────────────────────────────
  // État modal rejet
  // ─────────────────────────────────────────────
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [motif, setMotif] = useState('');

  // ─────────────────────────────────────────────
  // Fetch commandes
  // ─────────────────────────────────────────────
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await commandesApi.list({
        page,
        limit: 20,
        statut,
        search: search || undefined,
      });
      setCommandes(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [page, statut, search]);

  useEffect(() => { fetchCommandes(); }, [fetchCommandes]);

  // ─────────────────────────────────────────────
  // Charge boutiques (création)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!createOpen) return;
    boutiquesApi
      .list({ is_active: 1, limit: 200 })
      .then((d) => setBoutiques(d.data || []))
      .catch(console.warn);
  }, [createOpen]);

  // ─────────────────────────────────────────────
  // Charge produits (selon boutique)
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
  // Charge livreurs (validation)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!validateOpen) return;
    setLoadingLivreurs(true);
    livreursApi
      .actifs()
      .then((d) => setLivreurs(d.data || []))
      .catch(console.warn)
      .finally(() => setLoadingLivreurs(false));
  }, [validateOpen]);

  // ─────────────────────────────────────────────
  // Modal création
  // ─────────────────────────────────────────────
  const openCreate = () => {
    setSelectedBoutique('');
    setLignes([{ produit_id: '', quantite: 1 }]);
    setCreateOpen(true);
  };

  const addLigne = () => setLignes([...lignes, { produit_id: '', quantite: 1 }]);
  const updateLigne = (idx, field, value) => {
    const newLignes = [...lignes];
    newLignes[idx][field] = value;
    setLignes(newLignes);
  };
  const removeLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));

  const margeEstimee = lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id));
    if (!p) return sum;
    return sum + (p.prix_vente - p.prix_partenaire) * (parseInt(l.quantite) || 0);
  }, 0);

  const totalVente = lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id));
    if (!p) return sum;
    return sum + p.prix_vente * (parseInt(l.quantite) || 0);
  }, 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedBoutique) return toast.error('Sélectionnez une boutique');
    const validLignes = lignes.filter((l) => l.produit_id && l.quantite > 0);
    if (validLignes.length === 0) return toast.error('Ajoutez au moins un produit');

    setCreating(true);
    try {
      await commandesApi.create({
        boutique_id: parseInt(selectedBoutique),
        lignes: validLignes.map((l) => ({
          produit_id: parseInt(l.produit_id),
          quantite: parseInt(l.quantite),
        })),
      });
      toast.success('Commande créée, en attente de validation');
      setCreateOpen(false);
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Modal validation avec livraison
  // ─────────────────────────────────────────────
  const openValidate = (commande) => {
    setValidatingCommande(commande);
    setValidationForm({
      livreur_id: '',
      adresse_livraison: '',
      destinataire: '',
      telephone_destinataire: '',
      frais_livraison: '',
      notes_livraison: '',
    });
    setValidateOpen(true);
  };

  const handleValidate = async (e) => {
    e.preventDefault();

    // Validation
    if (!validationForm.livreur_id) {
      return toast.error('Sélectionnez un livreur');
    }
    if (!validationForm.adresse_livraison || validationForm.adresse_livraison.trim().length < 5) {
      return toast.error('Adresse de livraison requise (min. 5 caractères)');
    }

    setValidating(true);
    try {
      const res = await commandesApi.valider(validatingCommande.id, {
        livreur_id: parseInt(validationForm.livreur_id),
        adresse_livraison: validationForm.adresse_livraison,
        destinataire: validationForm.destinataire || undefined,
        telephone_destinataire: validationForm.telephone_destinataire || undefined,
        frais_livraison: validationForm.frais_livraison
          ? parseInt(validationForm.frais_livraison)
          : undefined,
        notes_livraison: validationForm.notes_livraison || undefined,
      });

      toast.success(res.message || 'Commande validée et livraison assignée');
      setValidateOpen(false);
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur validation');
    } finally {
      setValidating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Rejet
  // ─────────────────────────────────────────────
  const openReject = (commande) => {
    setRejectId(commande.id);
    setMotif('');
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!motif.trim()) return toast.error('Motif requis');
    try {
      await commandesApi.rejeter(rejectId, motif);
      toast.success('Commande rejetée');
      setRejectOpen(false);
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Détail
  // ─────────────────────────────────────────────
  const openDetail = async (commande) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await commandesApi.get(commande.id);
      setDetail(data.commande);
    } catch (err) {
      toast.error('Erreur chargement détail');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Colonnes
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'reference',
      label: 'Référence',
      render: (r) => <span className="font-mono text-xs">{r.reference}</span>,
    },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.created_at) },
    { key: 'agent_name', label: 'Agent' },
    { key: 'boutique_name', label: 'Boutique' },
    {
      key: 'nb_lignes',
      label: 'Articles',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
          {r.nb_lignes}
        </span>
      ),
    },
    {
      key: 'total_vente',
      label: 'Total',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.total_vente)}</span>,
    },
    {
      key: 'marge',
      label: 'Marge',
      align: 'right',
      render: (r) =>
        r.marge > 0 ? (
          <span className="text-emerald-600 font-semibold">{formatCFA(r.marge)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => {
        const s = STATUTS_COMMANDE[r.statut] || { label: r.statut, color: 'slate' };
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(r); }}
            className="p-1.5 rounded hover:bg-slate-100"
            title="Voir détail"
          >
            <Eye size={14} />
          </button>
          {(isGerant || isAdmin) && r.statut === 'en_attente' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); openValidate(r); }}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                title="Valider + assigner livreur"
              >
                <CheckCircle2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openReject(r); }}
                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                title="Rejeter"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
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
            <ShoppingCart className="text-brand-500" /> Commandes
          </h1>
          <p className="text-sm text-slate-500">{total} commande(s)</p>
        </div>
        {isAgent && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Nouvelle commande
          </Button>
        )}
      </div>

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => { setSearch(''); setStatut('all'); setPage(1); }}
      >
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validée</option>
          <option value="livree">Livrée</option>
          <option value="annulee">Annulée</option>
        </select>
      </FilterBar>

      {/* Tableau */}
      <DataTable columns={columns} data={commandes} loading={loading} emptyTitle="Aucune commande" />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL CRÉATION                             */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvelle commande"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
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

          {selectedBoutique && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Produits</label>
                {lignes.map((l, idx) => {
                  const produit = produits.find((p) => p.id === parseInt(l.produit_id));
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
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addLigne}
                  className="text-sm text-brand-500 hover:underline"
                >
                  + Ajouter une ligne
                </button>
              </div>

              <div className="p-3 rounded-lg bg-brand-50 border border-brand-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Total vente</span>
                  <span className="font-semibold">{formatCFA(totalVente)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-700">Marge estimée</span>
                  <span className="font-semibold text-emerald-600">{formatCFA(margeEstimee)}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={creating}>
              Créer la commande
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL VALIDATION + LIVRAISON               */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={validateOpen}
        onClose={() => setValidateOpen(false)}
        title="Valider la commande + Assigner livraison"
        size="lg"
      >
        {validatingCommande && (
          <form onSubmit={handleValidate} className="space-y-4">
            {/* Récap commande */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {validatingCommande.reference}
                  </p>
                  <p className="font-medium text-slate-800">{validatingCommande.boutique_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">
                    {formatCFA(validatingCommande.total_vente)}
                  </p>
                  <p className="text-xs text-emerald-600">
                    Marge : {formatCFA(validatingCommande.total_vente - validatingCommande.total_partenaire)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Agent : {validatingCommande.agent_name} • {validatingCommande.nb_lignes} article(s)
              </p>
            </div>

            {/* Info : le stock va être décrémenté */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                En validant, le stock sera décrémenté, une vente sera créée et une livraison sera assignée au livreur choisi.
              </p>
            </div>

            {/* Livreur */}
            <Select
              label="Livreur *"
              value={validationForm.livreur_id}
              onChange={(e) => setValidationForm({ ...validationForm, livreur_id: e.target.value })}
              required
            >
              <option value="">
                {loadingLivreurs ? 'Chargement...' : '— Sélectionner un livreur —'}
              </option>
              {livreurs.map((lv) => (
                <option key={lv.id} value={lv.id}>
                  {lv.fullname} — {lv.phone}
                  {lv.vehicle ? ` (${lv.vehicle})` : ''}
                  {lv.zone ? ` • ${lv.zone}` : ''}
                </option>
              ))}
            </Select>

            {/* Message si aucun livreur */}
            {!loadingLivreurs && livreurs.length === 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-800">
                  ⚠️ Aucun livreur actif. Demandez à l'admin de créer un livreur avant de valider.
                </p>
              </div>
            )}

            {/* Adresse livraison */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                <MapPin size={14} /> Adresse de livraison *
              </label>
              <textarea
                value={validationForm.adresse_livraison}
                onChange={(e) => setValidationForm({ ...validationForm, adresse_livraison: e.target.value })}
                rows={2}
                required
                minLength={5}
                maxLength={300}
                placeholder="Ex: Quartier Chagoua, Rue 1234, Porte 45, N'Djamena"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>

            {/* Destinataire + téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                  <User size={14} /> Destinataire (optionnel)
                </label>
                <input
                  type="text"
                  value={validationForm.destinataire}
                  onChange={(e) => setValidationForm({ ...validationForm, destinataire: e.target.value })}
                  placeholder="Nom du destinataire"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                  <Phone size={14} /> Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={validationForm.telephone_destinataire}
                  onChange={(e) => setValidationForm({ ...validationForm, telephone_destinataire: e.target.value })}
                  placeholder="8 chiffres"
                  maxLength={8}
                  pattern="\d{8}"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Frais livraison */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                <DollarSign size={14} /> Frais de livraison (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={validationForm.frais_livraison}
                  onChange={(e) => setValidationForm({ ...validationForm, frais_livraison: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 pr-16 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  FCFA
                </span>
              </div>
            </div>

            {/* Notes livraison */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                <FileText size={14} /> Notes de livraison (optionnel)
              </label>
              <textarea
                value={validationForm.notes_livraison}
                onChange={(e) => setValidationForm({ ...validationForm, notes_livraison: e.target.value })}
                rows={2}
                maxLength={500}
                placeholder="Instructions particulières pour le livreur..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setValidateOpen(false)}
                disabled={validating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={validating}
                disabled={livreurs.length === 0}
              >
                <Truck size={16} /> Valider et assigner
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DÉTAIL                               */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Détail commande"
        size="lg"
      >
        {detailLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Référence :</span>{' '}
                <strong className="font-mono">{detail.reference}</strong>
              </div>
              <div>
                <span className="text-slate-500">Statut :</span>{' '}
                <Badge color={STATUTS_COMMANDE[detail.statut]?.color}>
                  {STATUTS_COMMANDE[detail.statut]?.label}
                </Badge>
              </div>
              <div>
                <span className="text-slate-500">Agent :</span> {detail.agent_name}
              </div>
              <div>
                <span className="text-slate-500">Boutique :</span> {detail.boutique_name}
              </div>
              <div>
                <span className="text-slate-500">Date :</span> {formatDate(detail.created_at)}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Produit</th>
                    <th className="text-right px-3 py-2">Qté</th>
                    <th className="text-right px-3 py-2">Prix part.</th>
                    <th className="text-right px-3 py-2">Prix vente</th>
                    <th className="text-right px-3 py-2">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lignes?.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{l.produit_name}</td>
                      <td className="px-3 py-2 text-right">{l.quantite}</td>
                      <td className="px-3 py-2 text-right">{formatCFA(l.prix_partenaire_applique)}</td>
                      <td className="px-3 py-2 text-right">{formatCFA(l.prix_vente_applique)}</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                        {formatCFA(l.marge_calculee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">Total marge</td>
                    <td className="px-3 py-2 text-right text-emerald-600">
                      {formatCFA((detail.total_vente || 0) - (detail.total_partenaire || 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {detail.motif_annulation && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-800 font-medium">Motif de rejet</p>
                <p className="text-sm text-red-700 mt-1">{detail.motif_annulation}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL REJET                                */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rejeter la commande"
        size="sm"
      >
        <div className="space-y-3">
          <Input
            label="Motif du rejet *"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Stock non conforme"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
// frontend/src/pages/Ventes.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Receipt, TrendingUp, Wallet, Plus,
  Calendar, Search, X,
  CheckCircle2, Truck, MapPin, User, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ventesApi } from '../api/ventes.api';
import { boutiquesApi } from '../api/boutiques.api';
import { produitsApi } from '../api/produits.api';
import { livreursApi } from '../api/livreurs.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const EMPTY_LIGNE = { produit_id: '', quantite: 1 };

const STATUTS_LIVRAISON = {
  en_cours: { label: 'En cours', color: 'amber' },
  livree: { label: 'Livrée', color: 'emerald' },
  echouee: { label: 'Échouée', color: 'red' },
  annulee: { label: 'Annulée', color: 'slate' },
};

export default function Ventes() {
  const { user, isAdmin, isGerant, isAgent } = useAuth();
  const canSell = ['admin', 'agent', 'gerant'].includes(user?.role);

  // ─────────────────────────────────────────────
  // État liste
  // ─────────────────────────────────────────────
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(getTodayISO());
  const [search, setSearch] = useState('');
  const [boutiqueFilter, setBoutiqueFilter] = useState('');

  // Données annexes
  const [boutiques, setBoutiques] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Récap
  const [recap, setRecap] = useState(null);
  const [loadingRecap, setLoadingRecap] = useState(true);

  // ─────────────────────────────────────────────
  // État modal vente manuelle
  // ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [produits, setProduits] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // État livraison (dans le modal)
  // ─────────────────────────────────────────────
  const [withLivraison, setWithLivraison] = useState(false);
  const [livreurId, setLivreurId] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [destinataire, setDestinataire] = useState('');
  const [telephoneDestinataire, setTelephoneDestinataire] = useState('');
  const [fraisLivraison, setFraisLivraison] = useState('');
  const [notesLivraison, setNotesLivraison] = useState('');

  // ─────────────────────────────────────────────
  // Charge boutiques + livreurs
  // ─────────────────────────────────────────────
  useEffect(() => {
    boutiquesApi.list({ is_active: 1, limit: 200 })
      .then((d) => setBoutiques(d.data || []))
      .catch(console.warn);

    livreursApi.actifs()
      .then((d) => setLivreurs(d.data || []))
      .catch(console.warn);
  }, []);

  // ─────────────────────────────────────────────
  // Fetch ventes
  // ─────────────────────────────────────────────
  const fetchVentes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ventesApi.list({
        page,
        limit: 50,
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
        boutique_id: boutiqueFilter || undefined,
      });
      setVentes(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur chargement ventes');
    } finally {
      setLoading(false);
    }
  }, [page, from, to, search, boutiqueFilter]);

  // ─────────────────────────────────────────────
  // Fetch récap
  // ─────────────────────────────────────────────
  const fetchRecap = useCallback(async () => {
    setLoadingRecap(true);
    try {
      const data = await ventesApi.statsGlobal({
        from: from || undefined,
        to: to || undefined,
      });
      setRecap(data.stats);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingRecap(false);
    }
  }, [from, to]);

  useEffect(() => { fetchVentes(); }, [fetchVentes]);
  useEffect(() => { fetchRecap(); }, [fetchRecap]);

  // ─────────────────────────────────────────────
  // Charge produits selon boutique
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBoutique) {
      setProduits([]);
      return;
    }
    produitsApi.list({ boutique_id: selectedBoutique, is_active: 1, limit: 500 })
      .then((d) => setProduits(d.data || []))
      .catch(console.warn);
  }, [selectedBoutique]);

  // ─────────────────────────────────────────────
  // Ouvre / réinitialise le modal
  // ─────────────────────────────────────────────
  const openModal = () => {
    setSelectedBoutique('');
    setProduits([]);
    setLignes([{ ...EMPTY_LIGNE }]);
    setClientName('');
    setClientPhone('');
    setNotes('');
    setWithLivraison(false);
    setLivreurId('');
    setAdresseLivraison('');
    setDestinataire('');
    setTelephoneDestinataire('');
    setFraisLivraison('');
    setNotesLivraison('');
    setModalOpen(true);
  };

  // ─────────────────────────────────────────────
  // Gestion lignes
  // ─────────────────────────────────────────────
  const addLigne = () => setLignes([...lignes, { ...EMPTY_LIGNE }]);
  const updateLigne = (idx, field, value) => {
    const arr = [...lignes];
    arr[idx][field] = value;
    setLignes(arr);
  };
  const removeLigne = (idx) => {
    if (lignes.length === 1) return;
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  // ─────────────────────────────────────────────
  // Calculs totaux
  // ─────────────────────────────────────────────
  const totalVente = lignes.reduce((s, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id, 10));
    if (!p) return s;
    return s + p.prix_vente * (parseInt(l.quantite, 10) || 0);
  }, 0);

  const totalPartenaire = lignes.reduce((s, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id, 10));
    if (!p) return s;
    return s + p.prix_partenaire * (parseInt(l.quantite, 10) || 0);
  }, 0);

  const margeTotale = totalVente - totalPartenaire;

  // ─────────────────────────────────────────────
  // Soumission
  // ─────────────────────────────────────────────
  const handleCreateVente = async (e) => {
    e.preventDefault();
    if (!selectedBoutique) return toast.error('Sélectionnez une boutique');

    const lignesValides = lignes.filter((l) => l.produit_id && parseInt(l.quantite, 10) > 0);
    if (lignesValides.length === 0) {
      return toast.error('Ajoutez au moins un produit');
    }

    // Validation livraison
    if (withLivraison) {
      if (!livreurId) return toast.error('Sélectionnez un livreur');
      if (!adresseLivraison || adresseLivraison.trim().length < 5) {
        return toast.error('Adresse de livraison requise (min. 5 car.)');
      }
    }

    setSaving(true);
    try {
      const payload = {
        boutique_id: parseInt(selectedBoutique, 10),
        lignes: lignesValides.map((l) => ({
          produit_id: parseInt(l.produit_id, 10),
          quantite: parseInt(l.quantite, 10),
        })),
        client_name: clientName || undefined,
        client_phone: clientPhone || undefined,
        notes: notes || undefined,
      };

      // Ajouter livraison si activée
      if (withLivraison) {
        payload.livreur_id = parseInt(livreurId, 10);
        payload.adresse_livraison = adresseLivraison;
        payload.destinataire = destinataire || undefined;
        payload.telephone_destinataire = telephoneDestinataire || undefined;
        payload.frais_livraison = fraisLivraison ? parseInt(fraisLivraison, 10) : undefined;
        payload.notes_livraison = notesLivraison || undefined;
      }

      const res = await ventesApi.createManuel(payload);

      toast.success(res.message || 'Vente enregistrée');
      setModalOpen(false);
      fetchVentes();
      fetchRecap();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Reset filtres
  // ─────────────────────────────────────────────
  const resetFilters = () => {
    setFrom(getFirstDayOfMonth());
    setTo(getTodayISO());
    setSearch('');
    setBoutiqueFilter('');
    setPage(1);
  };

  const startIndex = (page - 1) * 50;

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-brand-500" /> Tableau de Suivi des Ventes
          </h1>
          <p className="text-sm text-slate-500">
            {total} vente(s) — {formatDate(from)} au {formatDate(to)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSell && (
            <Button onClick={openModal}>
              <Plus size={16} /> Nouvelle vente
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
          <Calendar size={14} className="text-slate-500 ml-2" />
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-2 py-1 rounded border border-slate-200 text-xs bg-white"
          />
          <span className="text-xs text-slate-500 px-1">au</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-2 py-1 rounded border border-slate-200 text-xs bg-white"
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher (référence, agent, boutique...)"
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>

        <select
          value={boutiqueFilter}
          onChange={(e) => { setBoutiqueFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">Toutes boutiques</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {(search || boutiqueFilter || from !== getFirstDayOfMonth() || to !== getTodayISO()) && (
          <button
            onClick={resetFilters}
            className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {/* ═══════ TABLEAU DE SUIVI ═══════ */}
      <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-300 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 text-center">
            Tableau de Suivi
          </h2>
          <p className="text-xs text-slate-500 text-center mt-1">
            Du {formatDate(from)} au {formatDate(to)}
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : ventes.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Aucune vente sur la période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="px-2 py-3 text-center text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '50px' }}>
                    N°
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '100px' }}>
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase border-r border-slate-300">
                    Produit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '130px' }}>
                    Partenaire
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '100px' }}>
                    Prix
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '60px' }}>
                    Qté
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '130px' }}>
                    Agent
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '150px' }}>
                    Livreur
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-slate-700 uppercase border-r border-slate-300" style={{ width: '110px' }}>
                    Total
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase" style={{ width: '120px' }}>
                    Obs
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventes.map((v, idx) => {
                  const numero = startIndex + idx + 1;
                  const livraisonStatut = STATUTS_LIVRAISON[v.livraison_statut];

                  return (
                    <tr
                      key={v.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    >
                      <td className="px-2 py-2 text-center text-xs font-medium text-slate-600 border-r border-slate-200">
                        {numero}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {formatDate(v.created_at)}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-800 border-r border-slate-200">
                        <div className="font-medium">
                          {v.nb_lignes ? `${v.nb_lignes} article(s)` : '—'}
                        </div>
                        {v.boutique_name && (
                          <div className="text-[10px] text-slate-500">{v.boutique_name}</div>
                        )}
                      </td>
                      {/* ✅ NOUVELLE COLONNE PARTENAIRE */}
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200">
                        {v.partenaire_name ? (
                          <div>
                            <div className="font-medium text-slate-800 truncate max-w-[120px]">
                              {v.partenaire_name}
                            </div>
                            {v.partenaire_phone && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {v.partenaire_phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {v.prix_unitaire ? formatCFA(v.prix_unitaire) : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-center text-slate-700 border-r border-slate-200">
                        {v.quantite_totale || v.nb_lignes || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200">
                        {v.agent_name || '—'}
                      </td>
                      {/* ✅ COLONNE LIVREUR AMÉLIORÉE */}
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200">
                        {v.livreur_name ? (
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Truck size={10} className="text-slate-400" />
                              {v.livreur_name}
                            </div>
                            {v.livreur_phone && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {v.livreur_phone}
                              </div>
                            )}
                            {livraisonStatut && (
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold
                                ${livraisonStatut.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : ''}
                                ${livraisonStatut.color === 'amber' ? 'bg-amber-100 text-amber-700' : ''}
                                ${livraisonStatut.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                                ${livraisonStatut.color === 'slate' ? 'bg-slate-100 text-slate-700' : ''}
                              `}>
                                {livraisonStatut.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-right text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {formatCFA(v.total_vente)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {v.marge_pourcentage >= 30 ? (
                          <span className="text-emerald-600 font-medium">{v.marge_pourcentage}% marge</span>
                        ) : v.marge_pourcentage >= 15 ? (
                          <span className="text-amber-600">{v.marge_pourcentage}% marge</span>
                        ) : (
                          <span className="text-slate-500">{v.marge_pourcentage}% marge</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} / {totalPages} — {total} vente(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ RÉCAPITULATIF ═══════ */}
      <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden">
        <div className="p-4 border-b-2 border-slate-300 bg-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📊 Récapitulatif de la période
          </h2>
        </div>
        {loadingRecap ? (
          <div className="py-8 flex items-center justify-center">
            <Spinner size={24} />
          </div>
        ) : recap ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-300">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase w-2/3">
                    Récapitulatif
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase w-1/3">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="font-medium">Total du jour</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatCFA(recap.total_vente || 0)}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-violet-500" />
                      <span className="font-medium">Total des produits</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatCFA(recap.nb_ventes ? recap.total_vente : 0)}
                    <span className="text-xs text-slate-500 ml-2">
                      ({recap.nb_ventes || 0} vente{recap.nb_ventes > 1 ? 's' : ''})
                    </span>
                  </td>
                </tr>
                <tr className="border-b-2 border-slate-300">
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-emerald-500" />
                      <span className="font-bold">Marge</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCFA(recap.total_marge || 0)}
                    </span>
                    <div className="text-xs text-emerald-500">
                      {recap.marge_pourcentage || 0}% de marge
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* ═══════ MODAL VENTE MANUELLE ═══════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enregistrer une vente manuelle"
        size="lg"
      >
        <form onSubmit={handleCreateVente} className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Cette vente sera automatiquement validée. Utilisez-la pour les ventes directes en boutique.
            </p>
          </div>

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
                <label className="text-sm font-medium text-slate-700">Produits *</label>
                {lignes.map((l, idx) => {
                  const produit = produits.find((p) => p.id === parseInt(l.produit_id, 10));
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
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30"
                      >
                        ×
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nom du client (optionnel)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <Input
                  label="Téléphone client (optionnel)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  maxLength={8}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              {/* ✅ SECTION LIVRAISON OPTIONNELLE */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withLivraison}
                    onChange={(e) => setWithLivraison(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <Truck size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    Assigner un livreur pour cette vente
                  </span>
                </label>
              </div>

              {withLivraison && (
                <div className="p-4 rounded-xl bg-white border-2 border-amber-200 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Truck size={14} className="text-amber-600" /> Informations de livraison
                  </h3>

                  <Select
                    label="Livreur *"
                    value={livreurId}
                    onChange={(e) => setLivreurId(e.target.value)}
                    required={withLivraison}
                  >
                    <option value="">— Sélectionner un livreur —</option>
                    {livreurs.map((lv) => (
                      <option key={lv.id} value={lv.id}>
                        {lv.fullname} — {lv.phone}
                        {lv.vehicle ? ` (${lv.vehicle})` : ''}
                        {lv.zone ? ` • ${lv.zone}` : ''}
                      </option>
                    ))}
                  </Select>

                  {livreurs.length === 0 && (
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs text-red-800">
                        ⚠️ Aucun livreur actif. Créez un livreur d'abord.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                      <MapPin size={14} /> Adresse de livraison *
                    </label>
                    <textarea
                      value={adresseLivraison}
                      onChange={(e) => setAdresseLivraison(e.target.value)}
                      rows={2}
                      required={withLivraison}
                      minLength={5}
                      maxLength={300}
                      placeholder="Ex: Quartier Chagoua, Rue 1234, Porte 45, N'Djamena"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                        <User size={14} /> Destinataire
                      </label>
                      <input
                        type="text"
                        value={destinataire}
                        onChange={(e) => setDestinataire(e.target.value)}
                        placeholder="Nom (optionnel)"
                        maxLength={100}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                        <Phone size={14} /> Téléphone
                      </label>
                      <input
                        type="tel"
                        value={telephoneDestinataire}
                        onChange={(e) => setTelephoneDestinataire(e.target.value)}
                        placeholder="8 chiffres"
                        maxLength={8}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Frais de livraison (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fraisLivraison}
                      onChange={(e) => setFraisLivraison(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Notes de livraison
                    </label>
                    <textarea
                      value={notesLivraison}
                      onChange={(e) => setNotesLivraison(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Instructions pour le livreur..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total vente</span>
                  <span className="font-semibold">{formatCFA(totalVente)}</span>
                </div>
                {withLivraison && fraisLivraison && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">+ Frais livraison</span>
                    <span className="font-semibold text-amber-600">
                      {formatCFA(parseInt(fraisLivraison) || 0)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Marge</span>
                  <span className="font-bold text-emerald-600">{formatCFA(margeTotale)}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              <CheckCircle2 size={16} /> Enregistrer la vente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
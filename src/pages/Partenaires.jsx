// frontend/src/pages/Partenaires.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Plus, Edit, Trash2, Eye, Search, X,
  TrendingUp, AlertTriangle, Phone, Star, ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { partenairesApi } from '../api/partenaires.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';
import KPICard from '../components/dashboard/KPICard';

const CATEGORIES = [
  { value: 'grossiste', label: 'Grossiste' },
  { value: 'detaillant', label: 'Détaillant' },
  { value: 'fabricant', label: 'Fabricant' },
  { value: 'importateur', label: 'Importateur' },
  { value: 'autre', label: 'Autre' },
];

const PAYMENT_TERMS = [
  { value: 'comptant', label: 'Comptant' },
  { value: '30j', label: '30 jours' },
  { value: '45j', label: '45 jours' },
  { value: '60j', label: '60 jours' },
  { value: '90j', label: '90 jours' },
  { value: 'autre', label: 'Autre' },
];

const EMPTY_FORM = {
  name: '',
  company_name: '',
  contact_name: '',
  phone: '',
  phone_secondary: '',
  email: '',
  address: '',
  city: '',
  province: '',
  country: 'Tchad',
  tax_id: '',
  registration_number: '',
  payment_terms: 'comptant',
  credit_limit: 0,
  discount_rate: 0,
  category: 'autre',
  notes: '',
  rating: 5,
};

export default function Partenaires() {
  const { isAdmin } = useAuth();

  const [partenaires, setPartenaires] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchPartenaires = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, order] = sort.split('_');
      const data = await partenairesApi.list({
        page,
        limit: 20,
        search: search || undefined,
        is_active: isActive,
        category,
        sort: sortField,
        order: order || 'asc',
      });
      setPartenaires(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, isActive, category, sort]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await partenairesApi.stats();
      setStats(data);
    } catch (err) {
      console.warn(err);
    }
  }, []);

  useEffect(() => { fetchPartenaires(); }, [fetchPartenaires]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ─────────────────────────────────────────────
  // Modal
  // ─────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      company_name: p.company_name || '',
      contact_name: p.contact_name || '',
      phone: p.phone || '',
      phone_secondary: p.phone_secondary || '',
      email: p.email || '',
      address: p.address || '',
      city: p.city || '',
      province: p.province || '',
      country: p.country || 'Tchad',
      tax_id: p.tax_id || '',
      registration_number: p.registration_number || '',
      payment_terms: p.payment_terms || 'comptant',
      credit_limit: p.credit_limit || 0,
      discount_rate: p.discount_rate || 0,
      category: p.category || 'autre',
      notes: p.notes || '',
      rating: p.rating || 5,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        credit_limit: parseInt(form.credit_limit, 10) || 0,
        discount_rate: parseFloat(form.discount_rate) || 0,
        rating: parseInt(form.rating, 10) || 5,
      };

      if (editing) {
        await partenairesApi.update(editing.id, payload);
        toast.success('Partenaire modifié');
      } else {
        await partenairesApi.create(payload);
        toast.success('Partenaire créé');
      }
      setModalOpen(false);
      fetchPartenaires();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    if (!confirm(`Changer le statut de "${p.name}" ?`)) return;
    try {
      if (p.is_active) {
        await partenairesApi.delete(p.id);
        toast.success('Partenaire désactivé');
      } else {
        await partenairesApi.update(p.id, { is_active: true });
        toast.success('Partenaire activé');
      }
      fetchPartenaires();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Colonnes
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Partenaire',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {r.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-800 truncate">{r.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="font-mono">{r.code}</span>
              {r.category && (
                <span className="text-slate-400">• {CATEGORIES.find(c => c.value === r.category)?.label || r.category}</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (r) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-slate-700">
            <Phone size={12} className="text-slate-400" /> {r.phone}
          </div>
          {r.email && <div className="text-xs text-slate-500 truncate max-w-[180px]">{r.email}</div>}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Localisation',
      render: (r) => (
        <div className="text-xs text-slate-600">
          {[r.city, r.province].filter(Boolean).join(', ') || '—'}
        </div>
      ),
    },
    {
      key: 'total_achats',
      label: 'Achats',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
          {r.total_achats}
        </span>
      ),
    },
    {
      key: 'total_montant',
      label: 'Montant total',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-slate-800">{formatCFA(r.total_montant)}</span>
      ),
    },
    {
      key: 'dernier_achat',
      label: 'Dernier achat',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {r.dernier_achat ? formatDate(r.dernier_achat) : '—'}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Note',
      align: 'center',
      render: (r) => (
        <div className="flex items-center gap-0.5 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={i < (r.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (r) => (
        <Badge color={r.is_active ? 'emerald' : 'slate'}>
          {r.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/partenaires/${r.id}`}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
            title="Voir détail"
          >
            <Eye size={14} />
          </Link>
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
                title="Modifier"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(r); }}
                className={`p-1.5 rounded ${r.is_active
                  ? 'hover:bg-red-50 text-red-600'
                  : 'hover:bg-emerald-50 text-emerald-600'}`}
                title={r.is_active ? 'Désactiver' : 'Activer'}
              >
                <Trash2 size={14} />
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
            <Building2 className="text-brand-500" /> Partenaires (Fournisseurs)
          </h1>
          <p className="text-sm text-slate-500">{total} partenaire(s)</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Nouveau partenaire
          </Button>
        )}
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Partenaires actifs"
            value={stats.partenaires?.actifs || 0}
            icon={Building2}
            color="brand"
            subtitle={`${stats.partenaires?.total_partenaires || 0} au total`}
          />
          <KPICard
            title="Total achats"
            value={stats.achats?.total_achats || 0}
            icon={ShoppingBag}
            color="violet"
            subtitle="commandes d'achat"
          />
          <KPICard
            title="Montant total"
            value={formatCFA(stats.achats?.total_montant || 0)}
            icon={TrendingUp}
            color="emerald"
          />
          <KPICard
            title="Montant dû"
            value={formatCFA(stats.achats?.montant_du || 0)}
            icon={AlertTriangle}
            color={stats.achats?.montant_du > 0 ? 'amber' : 'slate'}
            subtitle="à payer aux partenaires"
          />
        </div>
      )}

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => { setSearch(''); setIsActive('all'); setCategory('all'); setSort('name'); setPage(1); }}
      >
        <select
          value={isActive}
          onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="name_asc">Nom A→Z</option>
          <option value="name_desc">Nom Z→A</option>
          <option value="recent_desc">Plus récents</option>
          <option value="montant_desc">Plus gros montant</option>
          <option value="achats_desc">Plus d'achats</option>
        </select>
      </FilterBar>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={partenaires}
        loading={loading}
        emptyTitle="Aucun partenaire"
        emptyMessage="Créez votre premier partenaire pour commencer"
      />
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* ═══════ MODAL CRÉATION / ÉDITION ═══════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le partenaire' : 'Nouveau partenaire'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Infos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom commercial *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Raison sociale"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Ex: SARL KHAMIS Fournitures"
            />
            <Input
              label="Nom du contact"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              placeholder="Personne à contacter"
            />
            <Select
              label="Catégorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Téléphone principal *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="8 chiffres"
              maxLength={8}
              required
            />
            <Input
              label="Téléphone secondaire"
              value={form.phone_secondary}
              onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
              placeholder="8 chiffres"
              maxLength={8}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Note (1-5)"
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            />
          </div>

          {/* Adresse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Adresse"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rue, quartier..."
              />
            </div>
            <Input
              label="Ville"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="Province"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <Input
              label="Pays"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>

          {/* Conditions commerciales */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Conditions commerciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Délai de paiement"
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
              >
                {PAYMENT_TERMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
              <Input
                label="Plafond de crédit (FCFA)"
                type="number"
                min={0}
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
              />
              <Input
                label="Remise négociée (%)"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.discount_rate}
                onChange={(e) => setForm({ ...form, discount_rate: e.target.value })}
              />
            </div>
          </div>

          {/* Fiscale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NIF / Identifiant fiscal"
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            />
            <Input
              label="N° RCCM / Enregistrement"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Enregistrer' : 'Créer le partenaire'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
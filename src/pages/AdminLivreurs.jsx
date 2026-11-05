// frontend/src/pages/AdminLivreurs.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, ShieldCheck, ShieldOff,
  Search, X, Bike, Phone, MapPin, Truck, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { livreursApi } from '../api/livreurs.api';
import { formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';

const VEHICLES = [
  { value: 'moto', label: 'Moto' },
  { value: 'voiture', label: 'Voiture' },
  { value: 'velo', label: 'Vélo' },
  { value: 'camion', label: 'Camion' },
  { value: 'pied', label: 'À pied' },
];

const EMPTY_FORM = {
  fullname: '',
  phone: '',
  email: '',
  address: '',
  vehicle: 'moto',
  vehicle_plate: '',
  zone: '',
  notes: '',
};

const VEHICLE_ICONS = {
  moto: Bike,
  voiture: Truck,
  velo: Bike,
  camion: Truck,
  pied: Users,
};

export default function AdminLivreurs() {
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all');
  const [sort, setSort] = useState('name_asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchLivreurs = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, order] = sort.split('_');
      const data = await livreursApi.list({
        page,
        limit: 20,
        search: search || undefined,
        is_active: isActive,
        sort: sortField,
        order: order || 'asc',
      });
      setLivreurs(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur chargement livreurs');
    } finally {
      setLoading(false);
    }
  }, [page, search, isActive, sort]);

  useEffect(() => { fetchLivreurs(); }, [fetchLivreurs]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (livreur) => {
    setEditing(livreur);
    setForm({
      fullname: livreur.fullname,
      phone: livreur.phone,
      email: livreur.email || '',
      address: livreur.address || '',
      vehicle: livreur.vehicle || 'moto',
      vehicle_plate: livreur.vehicle_plate || '',
      zone: livreur.zone || '',
      notes: livreur.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await livreursApi.update(editing.id, form);
        toast.success('Livreur modifié');
      } else {
        await livreursApi.create(form);
        toast.success('Livreur créé');
      }
      setModalOpen(false);
      fetchLivreurs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (livreur) => {
    if (!confirm(`Désactiver "${livreur.fullname}" ?`)) return;
    try {
      await livreursApi.delete(livreur.id);
      toast.success('Livreur désactivé');
      fetchLivreurs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Colonnes
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'fullname',
      label: 'Livreur',
      render: (r) => {
        const VehicleIcon = VEHICLE_ICONS[r.vehicle] || Bike;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${r.is_active
                  ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white'
                  : 'bg-slate-200 text-slate-500'}`}
            >
              <VehicleIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-800">{r.fullname}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Phone size={10} /> {r.phone}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'vehicle',
      label: 'Véhicule',
      render: (r) => (
        <div className="text-sm">
          <div className="capitalize text-slate-700">{r.vehicle || '—'}</div>
          {r.vehicle_plate && (
            <div className="text-xs text-slate-500 font-mono">{r.vehicle_plate}</div>
          )}
        </div>
      ),
    },
    {
      key: 'zone',
      label: 'Zone',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm text-slate-600">
          <MapPin size={12} /> {r.zone || '—'}
        </span>
      ),
    },
    {
      key: 'total_livraisons',
      label: 'Livraisons',
      align: 'center',
      render: (r) => (
        <div className="text-sm">
          <div className="font-semibold text-slate-800">{r.total_livraisons}</div>
          <div className="text-[10px] text-slate-500">
            {r.livrees} livrées • {r.en_cours} en cours
          </div>
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
      key: 'created_at',
      label: 'Inscrit le',
      render: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/livreurs/${r.id}`}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
            title="Voir détail"
          >
            <Eye size={14} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
            title="Modifier"
          >
            <Edit size={14} />
          </button>
          {r.is_active === 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
              className="p-1.5 rounded hover:bg-red-50 text-red-600"
              title="Désactiver"
            >
              <Trash2 size={14} />
            </button>
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
            <Truck className="text-brand-500" /> Gestion des livreurs
          </h1>
          <p className="text-sm text-slate-500">{total} livreur(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nouveau livreur
        </Button>
      </div>

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => { setSearch(''); setIsActive('all'); setSort('name_asc'); setPage(1); }}
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
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="name_asc">Nom A→Z</option>
          <option value="name_desc">Nom Z→A</option>
          <option value="livraisons_desc">Plus de livraisons</option>
          <option value="recent_desc">Plus récents</option>
        </select>
      </FilterBar>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={livreurs}
        loading={loading}
        emptyTitle="Aucun livreur"
        emptyMessage="Commencez par ajouter votre premier livreur"
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* ═══════ MODAL CRÉATION / ÉDITION ═══════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le livreur' : 'Nouveau livreur'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom complet *"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              required
              minLength={3}
              maxLength={100}
            />
            <Input
              label="Téléphone * (8 chiffres)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              pattern="\d{8}"
              maxLength={8}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Adresse"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Véhicule *"
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
            >
              {VEHICLES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </Select>
            <Input
              label="Immatriculation"
              value={form.vehicle_plate}
              onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })}
              placeholder="Ex: TD-1234-A"
            />
          </div>

          <Input
            label="Zone de couverture"
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
            placeholder="Ex: N'Djamena Centre, Chagoua..."
          />

          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              maxLength={500}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Enregistrer' : 'Créer le livreur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
// frontend/src/pages/Boutiques.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Store, Package, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { boutiquesApi } from '../api/boutiques.api';
import { categoriesApi } from '../api/categories.api';
import { departementsApi } from '../api/departements.api';
import { usersApi } from '../api/users.api';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';
import { formatCFA } from '../utils/formatters';

import { Button, Modal, ConfirmModal, Badge } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { BoutiqueForm } from '../components/forms';

export default function Boutiques() {
  const { isAdmin, isGerant } = useRole();

  const [boutiques, setBoutiques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [gerants, setGerants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const filters = useFilters({ search: '', category_id: '' });
  const pag = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.values.search, 400);
  const modal = useModal();
  const confirm = useConfirm();

  // Charger les dépendances
  useEffect(() => {
    Promise.allSettled([
      categoriesApi.list({ is_active: 1 }).then((d) => d.data || []),
      departementsApi.list({ is_active: 1 }).then((d) => d.data || []),
      usersApi.forSelect({ role: 'gerant', limit: 500 }).then((d) => d.data || []),
    ]).then(([cats, deps, gers]) => {
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (deps.status === 'fulfilled') setDepartements(deps.value);
      if (gers.status === 'fulfilled') setGerants(gers.value);
    });
  }, []);

  const fetchBoutiques = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
        is_active: 'all',
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.values.category_id) params.category_id = filters.values.category_id;

      const data = await boutiquesApi.list(params);
      setBoutiques(data.data || []);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, debouncedSearch, filters.values.category_id]);

  useEffect(() => {
    fetchBoutiques();
  }, [fetchBoutiques]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await boutiquesApi.update(editing.id, payload);
        toast.success('Boutique modifiée');
      } else {
        await boutiquesApi.create(payload);
        toast.success('Boutique créée');
      }
      modal.close();
      fetchBoutiques();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    const ok = await confirm.ask({
      title: 'Désactiver la boutique ?',
      message: `"${b.name}" ne sera plus accessible.`,
      variant: 'danger',
      confirmLabel: 'Désactiver',
    });
    if (!ok) return;

    try {
      await boutiquesApi.delete(b.id);
      toast.success('Boutique désactivée');
      fetchBoutiques();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Boutique',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: r.category_color || '#1e3a5f' }}>
            <Store size={15} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-800 flex items-center gap-2">
              {r.name}
              {!r.is_active && <Badge color="slate">Inactif</Badge>}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin size={10} /> {r.address || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Catégorie',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: `${r.category_color}20`, color: r.category_color }}>
          {r.category_name}
        </span>
      ),
    },
    { key: 'departement_name', label: 'Département', render: (r) => r.departement_name || '—' },
    {
      key: 'gerant_name',
      label: 'Gérant',
      render: (r) => r.gerant_name ? (
        <div>
          <div className="text-sm font-medium">{r.gerant_name}</div>
          {r.gerant_phone && (
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Phone size={10} /> {r.gerant_phone}
            </div>
          )}
        </div>
      ) : <span className="text-slate-400 italic text-xs">Non assigné</span>,
    },
    {
      key: 'nb_produits',
      label: 'Produits',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs">
          <Package size={12} /> {r.nb_produits || 0}
        </span>
      ),
    },
    {
      key: 'ca_total',
      label: 'CA',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.ca_total)}</span>,
    },
    {
      key: 'marge_total',
      label: 'Marge',
      align: 'right',
      render: (r) => (
        <span className={`font-semibold ${(r.marge_total || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {formatCFA(r.marge_total || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setEditing(r); modal.open(r); }}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Modifier">
            <Edit size={14} />
          </button>
          {isAdmin && (
            <button onClick={() => handleDelete(r)}
              className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Désactiver">
              <Trash2 size={14} />
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
            <Store className="text-brand-500" /> Boutiques
          </h1>
          <p className="text-sm text-slate-500">{pag.total} boutique(s)</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); modal.open(); }}>
            <Plus size={16} /> Nouvelle boutique
          </Button>
        )}
      </div>

      <FilterBar
        search={filters.values.search}
        onSearchChange={(v) => { filters.set('search', v); pag.setPage(1); }}
        onReset={() => { filters.reset(); pag.setPage(1); }}
      >
        <select value={filters.values.category_id}
          onChange={(e) => { filters.set('category_id', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </FilterBar>

      <DataTable columns={columns} data={boutiques} loading={loading} emptyTitle="Aucune boutique" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      <Modal open={modal.isOpen} onClose={modal.close}
        title={editing ? 'Modifier la boutique' : 'Nouvelle boutique'} size="md">
        <BoutiqueForm
          initial={editing}
          categories={categories}
          departements={departements}
          gerants={gerants}
          onSubmit={handleSubmit}
          onCancel={modal.close}
          loading={saving}
          isGerant={isGerant}
        />
      </Modal>

      <ConfirmModal
        open={confirm.state.open}
        title={confirm.state.title}
        message={confirm.state.message}
        variant={confirm.state.variant}
        confirmLabel={confirm.state.confirmLabel}
        cancelLabel={confirm.state.cancelLabel}
        onConfirm={confirm.handleConfirm}
        onCancel={confirm.handleCancel}
      />
    </div>
  );
}
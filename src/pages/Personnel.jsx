// frontend/src/pages/Personnel.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, UserCog, Eye, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { personnelApi } from '../api/personnel.api';
import { departementsApi } from '../api/departements.api';
import { boutiquesApi } from '../api/boutiques.api';
import { useRole } from '../hooks/useRole';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';
import { formatCFA } from '../utils/formatters';
import { STATUTS_PERSONNEL } from '../utils/constants';

import { Button, Modal, ConfirmModal, Badge } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { PersonnelForm } from '../components/forms';

export default function Personnel() {
  const { isAdmin } = useRole();

  const [personnel, setPersonnel] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const filters = useFilters({ search: '', statut: 'actif' });
  const pag = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.values.search, 400);
  const modal = useModal();
  const confirm = useConfirm();

  useEffect(() => {
    Promise.allSettled([
      departementsApi.list({ is_active: 1 }).then((d) => d.data || []),
      boutiquesApi.list({ is_active: 1, limit: 500 }).then((d) => d.data || []),
    ]).then(([deps, bouts]) => {
      if (deps.status === 'fulfilled') setDepartements(deps.value);
      if (bouts.status === 'fulfilled') setBoutiques(bouts.value);
    });
  }, []);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.values.statut !== 'all') params.statut = filters.values.statut;

      const data = await personnelApi.list(params);
      setPersonnel(data.data || []);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, debouncedSearch, filters.values.statut]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await personnelApi.update(editing.id, payload);
        toast.success('Personnel modifié');
      } else {
        await personnelApi.create(payload);
        toast.success('Personnel créé');
      }
      modal.close();
      fetchPersonnel();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const ok = await confirm.ask({
      title: 'Marquer comme sorti ?',
      message: `"${p.fullname}" ne sera plus affiché comme actif.`,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await personnelApi.delete(p.id);
      toast.success('Marqué comme sorti');
      fetchPersonnel();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    {
      key: 'fullname',
      label: 'Nom',
      render: (r) => (
        <div>
          <div className="font-medium">{r.fullname}</div>
          <div className="text-xs text-slate-500">{r.phone || '—'}</div>
        </div>
      ),
    },
    { key: 'poste', label: 'Poste', render: (r) => r.poste || '—' },
    { key: 'departement_name', label: 'Département', render: (r) => r.departement_name || '—' },
    { key: 'boutique_name', label: 'Boutique', render: (r) => r.boutique_name || '—' },
    { key: 'type_contrat', label: 'Contrat', align: 'center' },
    {
      key: 'salaire_base',
      label: 'Salaire',
      align: 'right',
      render: (r) => formatCFA(r.salaire_base),
    },
    {
      key: 'total_paye',
      label: 'Total payé',
      align: 'right',
      render: (r) => <span className="text-emerald-600 font-semibold">{formatCFA(r.total_paye)}</span>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => {
        const s = STATUTS_PERSONNEL[r.statut] || { label: r.statut, color: 'slate' };
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/personnel/${r.id}`}
            className="p-1.5 rounded hover:bg-slate-100" title="Détails">
            <Eye size={14} />
          </Link>
          <button onClick={() => { setEditing(r); modal.open(r); }}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
            <Edit size={14} />
          </button>
          {isAdmin && r.statut === 'actif' && (
            <button onClick={() => handleDelete(r)}
              className="p-1.5 rounded hover:bg-red-50 text-red-600">
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
            <UserCog className="text-brand-500" /> Personnel
          </h1>
          <p className="text-sm text-slate-500">{pag.total} membre(s)</p>
        </div>
        <Button onClick={() => { setEditing(null); modal.open(); }}>
          <Plus size={16} /> Nouveau membre
        </Button>
      </div>

      <FilterBar
        search={filters.values.search}
        onSearchChange={(v) => { filters.set('search', v); pag.setPage(1); }}
        onReset={() => { filters.reset(); pag.setPage(1); }}
      >
        <select value={filters.values.statut}
          onChange={(e) => { filters.set('statut', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="sorti">Sorti</option>
        </select>
      </FilterBar>

      <DataTable columns={columns} data={personnel} loading={loading} emptyTitle="Aucun personnel" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      <Modal open={modal.isOpen} onClose={modal.close}
        title={editing ? 'Modifier le membre' : 'Nouveau membre'} size="lg">
        <PersonnelForm
          initial={editing}
          departements={departements}
          boutiques={boutiques}
          onSubmit={handleSubmit}
          onCancel={modal.close}
          loading={saving}
          isAdmin={isAdmin}
        />
      </Modal>

      <ConfirmModal
        open={confirm.state.open}
        title={confirm.state.title}
        message={confirm.state.message}
        variant={confirm.state.variant}
        onConfirm={confirm.handleConfirm}
        onCancel={confirm.handleCancel}
      />
    </div>
  );
}
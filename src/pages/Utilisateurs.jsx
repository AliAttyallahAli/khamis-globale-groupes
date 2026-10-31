// frontend/src/pages/Utilisateurs.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Key, Users, ShieldCheck, ShieldOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import { usersApi } from '../api/users.api';
import { formatDate } from '../utils/formatters';
import { ROLES } from '../utils/constants';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';

import { Button, Modal, ConfirmModal, Badge } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { UtilisateurForm } from '../components/forms';

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  // Hooks
  const filters = useFilters({ search: '', role: 'all', is_active: 'all' });
  const pag = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.values.search, 400);
  const modal = useModal();
  const confirm = useConfirm();
  const pwdModal = useModal();

  // ═══════════════════════════════════════════════
  // Charger utilisateurs
  // ═══════════════════════════════════════════════
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
        role: filters.values.role,
        is_active: filters.values.is_active,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await usersApi.list(params);
      setUsers(data.data || []);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, debouncedSearch, filters.values.role, filters.values.is_active]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ═══════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════
  const handleOpenCreate = () => {
    setEditing(null);
    modal.open();
  };

  const handleOpenEdit = (u) => {
    setEditing(u);
    modal.open(u);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await usersApi.update(editing.id, payload);
        toast.success('Utilisateur modifié');
      } else {
        await usersApi.create(payload);
        toast.success('Utilisateur créé');
      }
      modal.close();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u) => {
    const action = u.is_active ? 'désactiver' : 'activer';
    const ok = await confirm.ask({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} cet utilisateur ?`,
      message: `${u.fullname} (${u.phone}) sera ${u.is_active ? 'déconnecté et bloqué' : 'réactivé'}.`,
      variant: u.is_active ? 'danger' : 'success',
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
    });
    if (!ok) return;

    try {
      await usersApi.toggleActive(u.id);
      toast.success(`Utilisateur ${u.is_active ? 'désactivé' : 'activé'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleResetPassword = async (u) => {
    const newPwd = prompt(
      `Nouveau mot de passe pour ${u.fullname} (laisser vide = auto-généré)`
    );
    if (newPwd === null) return;

    try {
      const res = await usersApi.resetPassword(u.id, newPwd ? { newPassword: newPwd } : {});
      toast.success(
        `Mot de passe réinitialisé : ${res.generatedPassword || newPwd}`,
        { duration: 8000 }
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (u) => {
    const ok = await confirm.ask({
      title: 'Supprimer cet utilisateur ?',
      message: `${u.fullname} (${u.phone}) sera désactivé (soft delete).`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;

    try {
      await usersApi.delete(u.id);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ═══════════════════════════════════════════════
  // Colonnes
  // ═══════════════════════════════════════════════
  const columns = [
    {
      key: 'fullname',
      label: 'Utilisateur',
      render: (r) => (
        <div>
          <div className="font-medium">{r.fullname}</div>
          <div className="text-xs text-slate-500">{r.phone}</div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    {
      key: 'role',
      label: 'Rôle',
      render: (r) => {
        const cfg = ROLES[r.role] || { label: r.role, color: 'slate' };
        return <Badge color={cfg.color}>{cfg.label}</Badge>;
      },
    },
    { key: 'province', label: 'Province', render: (r) => r.province || '—' },
    {
      key: 'is_active',
      label: 'Statut',
      render: (r) => (
        <Badge color={r.is_active ? 'emerald' : 'red'}>
          {r.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    { key: 'created_at', label: 'Inscrit le', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Modifier">
            <Edit size={14} />
          </button>
          <button onClick={() => handleResetPassword(r)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title="Reset mot de passe">
            <Key size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(r)}
            className={`p-1.5 rounded ${r.is_active ? 'hover:bg-red-50 text-red-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
            title={r.is_active ? 'Désactiver' : 'Activer'}
          >
            {r.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          </button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-brand-500" /> Utilisateurs
          </h1>
          <p className="text-sm text-slate-500">
            {pag.total} utilisateur{pag.total > 1 ? 's' : ''}
            {filters.hasActiveFilters && ` · ${filters.activeCount} filtre(s)`}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={16} /> Nouvel utilisateur
        </Button>
      </div>

      <FilterBar
        search={filters.values.search}
        onSearchChange={(v) => { filters.set('search', v); pag.setPage(1); }}
        onReset={() => { filters.reset(); pag.setPage(1); }}
      >
        <select
          value={filters.values.role}
          onChange={(e) => { filters.set('role', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Tous les rôles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filters.values.is_active}
          onChange={(e) => { filters.set('is_active', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
      </FilterBar>

      <DataTable columns={columns} data={users} loading={loading} emptyTitle="Aucun utilisateur" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title={editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="md"
      >
        <UtilisateurForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={modal.close}
          loading={saving}
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
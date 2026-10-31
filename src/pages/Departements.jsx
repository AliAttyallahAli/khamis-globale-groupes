// frontend/src/pages/Departements.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Building2, Store, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { departementsApi } from '../api/departements.api';
import { usersApi } from '../api/users.api';
import { useRole } from '../hooks/useRole';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';

import { Button, Modal, ConfirmModal, Badge, Input, Select } from '../components/ui';
import { DataTable } from '../components/data';

const EMPTY = { name: '', description: '', responsable_id: '' };

export default function Departements() {
  const { isAdmin } = useRole();
  const [departements, setDepartements] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const modal = useModal();
  const confirm = useConfirm();

  useEffect(() => {
    usersApi.forSelect({ role: 'gerant', limit: 500 })
      .then((d) => setResponsables(d.data || []))
      .catch(console.warn);
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departementsApi.list({ is_active: 'all' });
      setDepartements(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleOpen = (d = null) => {
    setEditing(d);
    setForm(d ? {
      name: d.name || '',
      description: d.description || '',
      responsable_id: d.responsable_id || '',
    } : EMPTY);
    modal.open(d);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nom requis');

    setSaving(true);
    try {
      const payload = {
        ...form,
        responsable_id: form.responsable_id ? parseInt(form.responsable_id, 10) : null,
      };
      if (editing) {
        await departementsApi.update(editing.id, payload);
        toast.success('Département modifié');
      } else {
        await departementsApi.create(payload);
        toast.success('Département créé');
      }
      modal.close();
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    const ok = await confirm.ask({
      title: 'Désactiver ce département ?',
      message: `"${d.name}" ne sera plus accessible.`,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await departementsApi.delete(d.id);
      toast.success('Département désactivé');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    { key: 'name', label: 'Département' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'responsable_name', label: 'Responsable', render: (r) => r.responsable_name || '—' },
    {
      key: 'nb_boutiques',
      label: 'Boutiques',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs">
          <Store size={12} /> {r.nb_boutiques || 0}
        </span>
      ),
    },
    {
      key: 'nb_personnel',
      label: 'Personnel',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs">
          <Users size={12} /> {r.nb_personnel || 0}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (r) => <Badge color={r.is_active ? 'emerald' : 'slate'}>{r.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => handleOpen(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
            <Edit size={14} />
          </button>
          {isAdmin && (
            <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="text-brand-500" /> Départements
        </h1>
        {isAdmin && (
          <Button onClick={() => handleOpen()}>
            <Plus size={16} /> Nouveau département
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={departements} loading={loading} emptyTitle="Aucun département" />

      <Modal open={modal.isOpen} onClose={modal.close}
        title={editing ? 'Modifier le département' : 'Nouveau département'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Responsable" value={form.responsable_id}
            onChange={(e) => setForm({ ...form, responsable_id: e.target.value })}>
            <option value="">— Aucun —</option>
            {responsables.map((u) => (
              <option key={u.id} value={u.id}>{u.fullname}</option>
            ))}
          </Select>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={modal.close}>Annuler</Button>
            <Button type="submit" loading={saving}>{editing ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
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
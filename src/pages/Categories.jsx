// frontend/src/pages/Categories.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Tags, Package, Store } from 'lucide-react';
import toast from 'react-hot-toast';

import { categoriesApi } from '../api/categories.api';
import { useRole } from '../hooks/useRole';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';

import { Button, Modal, ConfirmModal, Badge, Input } from '../components/ui';
import { DataTable } from '../components/data';

const EMPTY = { name: '', description: '', color: '#1e3a5f', parent_id: '' };

export default function Categories() {
  const { isAdmin } = useRole();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const modal = useModal();
  const confirm = useConfirm();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list({ is_active: 'all' });
      setCategories(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleOpen = (c = null) => {
    setEditing(c);
    setForm(c ? {
      name: c.name || '',
      description: c.description || '',
      color: c.color || '#1e3a5f',
      parent_id: c.parent_id || '',
    } : EMPTY);
    modal.open(c);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nom requis');

    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      };
      if (editing) {
        await categoriesApi.update(editing.id, payload);
        toast.success('Catégorie modifiée');
      } else {
        await categoriesApi.create(payload);
        toast.success('Catégorie créée');
      }
      modal.close();
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    const ok = await confirm.ask({
      title: 'Désactiver cette catégorie ?',
      message: `"${c.name}" ne sera plus disponible.`,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await categoriesApi.delete(c.id);
      toast.success('Catégorie désactivée');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Catégorie',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
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
          <button onClick={() => handleOpen(r)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
            <Edit size={14} />
          </button>
          {isAdmin && (
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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Tags className="text-brand-500" /> Catégories
        </h1>
        {isAdmin && (
          <Button onClick={() => handleOpen()}>
            <Plus size={16} /> Nouvelle catégorie
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={categories} loading={loading} emptyTitle="Aucune catégorie" />

      <Modal open={modal.isOpen} onClose={modal.close}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-slate-700">Couleur</label>
            <input type="color" value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="mt-1 w-full h-10 rounded-lg border border-slate-300 cursor-pointer" />
          </div>
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
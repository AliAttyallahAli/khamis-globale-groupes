// frontend/src/pages/Ravitaillements.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2, XCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/axios';
import { boutiquesApi } from '../api/boutiques.api';
import { produitsApi } from '../api/produits.api';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { formatDate } from '../utils/formatters';

import { Button, Modal, Badge, Input } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { RavitaillementForm } from '../components/forms';

const STATUTS = {
  demande: { label: 'Demandé', color: 'amber' },
  en_cours: { label: 'En cours', color: 'blue' },
  recu: { label: 'Reçu', color: 'emerald' },
  annule: { label: 'Annulé', color: 'red' },
};

export default function Ravitaillements() {
  const [items, setItems] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const filters = useFilters({ statut: 'all' });
  const pag = usePagination({ initialLimit: 20 });
  const createModal = useModal();
  const receiveModal = useModal();

  const [qteRecue, setQteRecue] = useState('');

  useEffect(() => {
    Promise.allSettled([
      boutiquesApi.list({ is_active: 1, limit: 500 }).then((d) => d.data || []),
      produitsApi.list({ is_active: 1, limit: 500 }).then((d) => d.data || []),
    ]).then(([b, p]) => {
      if (b.status === 'fulfilled') setBoutiques(b.value);
      if (p.status === 'fulfilled') setProduits(p.value);
    });
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pag.page, limit: pag.limit };
      if (filters.values.statut !== 'all') params.statut = filters.values.statut;
      const { data } = await api.get('/ravitaillements', { params });
      setItems(data.data || []);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, filters.values.statut]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await api.post('/ravitaillements', payload);
      toast.success('Demande envoyée');
      createModal.close();
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async () => {
    if (!qteRecue || parseInt(qteRecue, 10) <= 0) return toast.error('Quantité requise');
    try {
      await api.put(`/ravitaillements/${receiveModal.data.id}/recevoir`, {
        quantite_recue: parseInt(qteRecue, 10),
      });
      toast.success('Stock incrémenté');
      receiveModal.close();
      setQteRecue('');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleCancel = async (r) => {
    if (!confirm('Annuler ce ravitaillement ?')) return;
    try {
      await api.put(`/ravitaillements/${r.id}/annuler`);
      toast.success('Annulé');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
    { key: 'boutique_name', label: 'Boutique' },
    {
      key: 'produit_name', label: 'Produit',
      render: (r) => (
        <div>
          <div className="font-medium">{r.produit_name}</div>
          <div className="text-xs text-slate-500 font-mono">{r.produit_ref}</div>
        </div>
      ),
    },
    { key: 'quantite_demandee', label: 'Demandé', align: 'center' },
    { key: 'quantite_recue', label: 'Reçu', align: 'center', render: (r) => r.quantite_recue || '—' },
    { key: 'stock_actuel', label: 'Stock actuel', align: 'center' },
    {
      key: 'statut', label: 'Statut',
      render: (r) => {
        const s = STATUTS[r.statut] || { label: r.statut, color: 'slate' };
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    { key: 'lanceur_name', label: 'Lancé par', render: (r) => r.lanceur_name || '—' },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.statut !== 'recu' && r.statut !== 'annule' && (
            <>
              <button onClick={() => { receiveModal.open(r); setQteRecue(r.quantite_demandee); }}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Réceptionner">
                <CheckCircle2 size={14} />
              </button>
              <button onClick={() => handleCancel(r)}
                className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Annuler">
                <XCircle size={14} />
              </button>
            </>
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
            <Truck className="text-brand-500" /> Ravitaillements
          </h1>
          <p className="text-sm text-slate-500">{pag.total} demande(s)</p>
        </div>
        <Button onClick={() => createModal.open()}>
          <Plus size={16} /> Nouveau ravitaillement
        </Button>
      </div>

      <FilterBar onReset={() => { filters.reset(); pag.setPage(1); }}>
        <select value={filters.values.statut}
          onChange={(e) => { filters.set('statut', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous statuts</option>
          <option value="demande">Demandé</option>
          <option value="en_cours">En cours</option>
          <option value="recu">Reçu</option>
          <option value="annule">Annulé</option>
        </select>
      </FilterBar>

      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Aucun ravitaillement" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      <Modal open={createModal.isOpen} onClose={createModal.close}
        title="Nouvelle demande" size="md">
        <RavitaillementForm
          boutiques={boutiques}
          produits={produits}
          onSubmit={handleCreate}
          onCancel={createModal.close}
          loading={saving}
        />
      </Modal>

      <Modal open={receiveModal.isOpen} onClose={receiveModal.close}
        title="Réceptionner le ravitaillement" size="sm">
        {receiveModal.data && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              <strong>{receiveModal.data.produit_name}</strong> — demandé : {receiveModal.data.quantite_demandee} unités
            </p>
            <Input label="Quantité reçue *" type="number" min={1}
              max={receiveModal.data.quantite_demandee}
              value={qteRecue}
              onChange={(e) => setQteRecue(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={receiveModal.close}>Annuler</Button>
              <Button variant="success" onClick={handleReceive}>
                <CheckCircle2 size={16} /> Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
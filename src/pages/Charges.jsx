// frontend/src/pages/Charges.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2, XCircle, Trash2, CreditCard, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';

import { chargesApi } from '../api/charges.api';
import { boutiquesApi } from '../api/boutiques.api';
import { useRole } from '../hooks/useRole';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';
import { formatCFA, formatDate } from '../utils/formatters';
import { TYPES_CHARGE, MOYENS_PAIEMENT, STATUTS_CHARGE } from '../utils/constants';

import { Button, Modal, ConfirmModal, Badge, Input } from '../components/ui';
import { DataTable, FilterBar, Pagination, ExportButtons } from '../components/data';
import { ChargeForm } from '../components/forms';

export default function Charges() {
  const { isAdmin } = useRole();

  const [charges, setCharges] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalMontant, setTotalMontant] = useState(0);
  const [editing, setEditing] = useState(null);

  const filters = useFilters({ search: '', statut: 'all', type: 'all', from: '', to: '' });
  const pag = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.values.search, 400);
  const createModal = useModal();
  const rejectModal = useModal();
  const [rejectMotif, setRejectMotif] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    boutiquesApi.list({ is_active: 1, limit: 500 })
      .then((d) => setBoutiques(d.data || []))
      .catch(console.warn);
  }, []);

  const fetchCharges = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
        statut: filters.values.statut,
        type: filters.values.type,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.values.from) params.from = filters.values.from;
      if (filters.values.to) params.to = filters.values.to;

      const data = await chargesApi.list(params);
      setCharges(data.data || []);
      setTotalMontant(data.total_montant || 0);
      pag.setPagination(data.pagination);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, debouncedSearch, filters.values.statut, filters.values.type, filters.values.from, filters.values.to]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await chargesApi.create(payload);
      toast.success(isAdmin ? 'Charge enregistrée' : 'Charge envoyée');
      createModal.close();
      fetchCharges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleValider = async (c) => {
    const ok = await confirm.ask({
      title: 'Valider cette charge ?',
      message: `${c.type} — ${formatCFA(c.montant)}`,
      variant: 'success',
    });
    if (!ok) return;

    try {
      await chargesApi.valider(c.id);
      toast.success('Charge validée');
      fetchCharges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleReject = async () => {
    if (!rejectMotif.trim()) return toast.error('Motif requis');
    try {
      await chargesApi.rejeter(rejectModal.data.id, rejectMotif.trim());
      toast.success('Charge rejetée');
      rejectModal.close();
      setRejectMotif('');
      fetchCharges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (c) => {
    const ok = await confirm.ask({
      title: 'Supprimer cette charge ?',
      message: 'Action irréversible.',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await chargesApi.delete(c.id);
      toast.success('Supprimée');
      fetchCharges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date_charge) },
    { key: 'type', label: 'Type', render: (r) => <Badge color="violet">{r.type}</Badge> },
    { key: 'boutique_name', label: 'Boutique', render: (r) => r.boutique_name || <span className="text-xs italic text-slate-400">Générale</span> },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.montant)}</span>,
    },
    {
      key: 'moyen_paiement',
      label: 'Moyen',
      render: (r) => (
        <span className="text-xs">{MOYENS_PAIEMENT.find((m) => m.value === r.moyen_paiement)?.label || r.moyen_paiement}</span>
      ),
    },
    {
      key: 'justification',
      label: 'Justification',
      render: (r) => <span className="text-xs line-clamp-2 max-w-[200px]">{r.justification}</span>,
    },
    {
      key: 'statut', label: 'Statut',
      render: (r) => {
        const s = STATUTS_CHARGE[r.statut] || { label: r.statut, color: 'slate' };
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.piece_jointe && (
            <a href={`http://localhost:9000/${r.piece_jointe}`} target="_blank" rel="noreferrer"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Pièce jointe">
              <FileUp size={14} />
            </a>
          )}
          {isAdmin && r.statut === 'en_attente' && (
            <>
              <button onClick={() => handleValider(r)}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Valider">
                <CheckCircle2 size={14} />
              </button>
              <button onClick={() => rejectModal.open(r)}
                className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Rejeter">
                <XCircle size={14} />
              </button>
            </>
          )}
          {isAdmin && (
            <button onClick={() => handleDelete(r)}
              className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Supprimer">
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
            <CreditCard className="text-brand-500" /> Charges
          </h1>
          <p className="text-sm text-slate-500">
            {pag.total} charge(s) — Total : <strong>{formatCFA(totalMontant)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons endpoint="/rapports/charges"
            params={{ from: filters.values.from, to: filters.values.to }}
            filenameBase="charges" />
          <Button onClick={() => createModal.open()}>
            <Plus size={16} /> Nouvelle charge
          </Button>
        </div>
      </div>

      <FilterBar
        search={filters.values.search}
        onSearchChange={(v) => { filters.set('search', v); pag.setPage(1); }}
        onReset={() => { filters.reset(); pag.setPage(1); }}
      >
        <select value={filters.values.type}
          onChange={(e) => { filters.set('type', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous types</option>
          {TYPES_CHARGE.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.values.statut}
          onChange={(e) => { filters.set('statut', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validée</option>
          <option value="rejetee">Rejetée</option>
        </select>
        <input type="date" value={filters.values.from}
          onChange={(e) => { filters.set('from', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input type="date" value={filters.values.to}
          onChange={(e) => { filters.set('to', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      </FilterBar>

      <DataTable columns={columns} data={charges} loading={loading} emptyTitle="Aucune charge" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />

      <Modal open={createModal.isOpen} onClose={createModal.close}
        title="Nouvelle charge" size="md">
        <ChargeForm
          initial={editing}
          boutiques={boutiques}
          onSubmit={handleCreate}
          onCancel={createModal.close}
          loading={saving}
          isAdmin={isAdmin}
        />
      </Modal>

      <Modal open={rejectModal.isOpen} onClose={rejectModal.close}
        title="Rejeter la charge" size="sm">
        <div className="space-y-3">
          <Input label="Motif *" value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            placeholder="Ex: Justificatif manquant" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={rejectModal.close}>Annuler</Button>
            <Button variant="danger" onClick={handleReject}>Rejeter</Button>
          </div>
        </div>
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
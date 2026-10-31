// frontend/src/pages/Paiements.jsx
import { useEffect, useState, useCallback } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

import { paiementsApi } from '../api/paiements.api';
import { useFilters } from '../hooks/useFilters';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../hooks/useModal';
import { formatCFA, formatDate } from '../utils/formatters';
import { TYPES_PAIEMENT, MOYENS_PAIEMENT } from '../utils/constants';

import { Badge } from '../components/ui';
import { DataTable, FilterBar, Pagination } from '../components/data';
import { KPICard } from '../components/dashboard';

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = useFilters({ type: 'all', moyen_paiement: 'all', from: '', to: '' });
  const pag = usePagination({ initialLimit: 20 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pag.page,
        limit: pag.limit,
        type: filters.values.type,
        moyen_paiement: filters.values.moyen_paiement,
        from: filters.values.from || undefined,
        to: filters.values.to || undefined,
      };
      const [list, statsRes] = await Promise.all([
        paiementsApi.list(params),
        paiementsApi.stats({ from: filters.values.from || undefined, to: filters.values.to || undefined }),
      ]);
      setPaiements(list.data || []);
      pag.setPagination(list.pagination);
      setStats(statsRes.global);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [pag.page, pag.limit, filters.values.type, filters.values.moyen_paiement, filters.values.from, filters.values.to]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
    { key: 'personnel_name', label: 'Personnel' },
    { key: 'poste', label: 'Poste', render: (r) => r.poste || '—' },
    { key: 'boutique_name', label: 'Boutique', render: (r) => r.boutique_name || '—' },
    { key: 'type', label: 'Type', render: (r) => <Badge color="violet">{r.type}</Badge> },
    {
      key: 'moyen_paiement',
      label: 'Moyen',
      render: (r) => MOYENS_PAIEMENT.find((m) => m.value === r.moyen_paiement)?.label || r.moyen_paiement,
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.montant)}</span>,
    },
    {
      key: 'justification',
      label: 'Justification',
      render: (r) => (
        <span className="text-xs text-slate-600 line-clamp-2 max-w-[250px]">{r.justification}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-brand-500" /> Paiements personnel
        </h1>
        <p className="text-sm text-slate-500">{pag.total} paiement(s)</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total paiements" value={formatCFA(stats.total)} icon={TrendingUp} color="emerald" />
          <KPICard title="Salaires" value={formatCFA(stats.salaires)} color="brand" />
          <KPICard title="Primes" value={formatCFA(stats.primes)} color="violet" />
          <KPICard title="Avances" value={formatCFA(stats.avances)} color="amber" />
        </div>
      )}

      <FilterBar onReset={() => { filters.reset(); pag.setPage(1); }}>
        <select value={filters.values.type}
          onChange={(e) => { filters.set('type', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous les types</option>
          {TYPES_PAIEMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filters.values.moyen_paiement}
          onChange={(e) => { filters.set('moyen_paiement', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">Tous moyens</option>
          {MOYENS_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input type="date" value={filters.values.from}
          onChange={(e) => { filters.set('from', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input type="date" value={filters.values.to}
          onChange={(e) => { filters.set('to', e.target.value); pag.setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      </FilterBar>

      <DataTable columns={columns} data={paiements} loading={loading} emptyTitle="Aucun paiement" />
      <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total} onPageChange={pag.setPage} />
    </div>
  );
}
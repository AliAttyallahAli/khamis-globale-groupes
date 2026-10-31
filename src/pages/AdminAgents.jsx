// frontend/src/pages/AdminAgents.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, X, Eye, ShieldCheck, ShieldOff,
  TrendingUp, Wallet, Store, UserCheck, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { adminAgentsApi } from '../api/admin-agents.api';
import { formatCFA, formatDate, formatPercent } from '../utils/formatters';

import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all');
  const [sort, setSort] = useState('name');

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, order] = sort.split('_');
      const data = await adminAgentsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        is_active: isActive,
        sort: sortField,
        order: order || 'asc',
      });
      setAgents(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur chargement agents');
    } finally {
      setLoading(false);
    }
  }, [page, search, isActive, sort]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // ─────────────────────────────────────────────
  // Toggle actif
  // ─────────────────────────────────────────────
  const handleToggle = async (agent) => {
    if (!confirm(`Changer le statut de "${agent.fullname}" ?`)) return;
    try {
      const res = await adminAgentsApi.toggleActive(agent.id);
      toast.success(res.message);
      fetchAgents();
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
      label: 'Agent',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
              ${r.is_active
                ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white'
                : 'bg-slate-200 text-slate-500'}`}
          >
            {r.fullname?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-800">{r.fullname}</div>
            <div className="text-xs text-slate-500 font-mono">{r.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (r) => (
        <div className="text-sm">
          {r.email && <div className="text-slate-600 truncate max-w-[160px]">{r.email}</div>}
          {r.province && <div className="text-xs text-slate-400">{r.province}</div>}
        </div>
      ),
    },
    {
      key: 'total_ventes',
      label: 'Ventes',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
          {r.total_ventes}
        </span>
      ),
    },
    {
      key: 'total_ca',
      label: 'CA total',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-slate-800">{formatCFA(r.total_ca)}</span>
      ),
    },
    {
      key: 'total_marge',
      label: 'Marge',
      align: 'right',
      render: (r) => (
        <span className="text-emerald-600 font-semibold">{formatCFA(r.total_marge)}</span>
      ),
    },
    {
      key: 'nb_boutiques',
      label: 'Boutiques',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <Store size={12} /> {r.nb_boutiques}
        </span>
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
            to={`/admin/agents/${r.id}`}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
            title="Voir détail"
          >
            <Eye size={14} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(r); }}
            className={`p-1.5 rounded ${r.is_active
              ? 'hover:bg-red-50 text-red-600'
              : 'hover:bg-emerald-50 text-emerald-600'}`}
            title={r.is_active ? 'Désactiver' : 'Activer'}
          >
            {r.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          </button>
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
            <Users className="text-brand-500" /> Gestion des agents
          </h1>
          <p className="text-sm text-slate-500">{total} agent(s) au total</p>
        </div>
      </div>

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => { setSearch(''); setIsActive('all'); setSort('name'); setPage(1); }}
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
          <option value="ventes_desc">Plus de ventes</option>
          <option value="marge_desc">Plus de marge</option>
          <option value="recent_desc">Plus récents</option>
        </select>
      </FilterBar>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={agents}
        loading={loading}
        emptyTitle="Aucun agent"
        emptyMessage="Aucun agent ne correspond à vos filtres"
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
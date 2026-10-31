// frontend/src/pages/AgentVentes.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  TrendingUp, Wallet, Receipt, Calendar, Filter,
  Search, X, BarChart3, Store, Package, Tag, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

import { agentApi } from '../api/agent.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA, formatDate, formatPercent } from '../utils/formatters';

import DataTable from '../components/data/DataTable';
import Pagination from '../components/data/Pagination';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import KPICard from '../components/dashboard/KPICard';

const PRESETS = [
  { label: "Aujourd'hui", days: 0 },
  { label: '7 derniers jours', days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: '90 derniers jours', days: 90 },
  { label: 'Cette année', days: 'year' },
];

const COLOR_PALETTE = ['#1e3a5f', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];

function getDateRange(preset) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  if (preset === 'year') {
    const from = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    return { from, to };
  }

  const from = new Date(today);
  from.setDate(from.getDate() - preset);
  return { from: from.toISOString().slice(0, 10), to };
}

export default function AgentVentes() {
  const { user } = useAuth();

  // ─────────────────────────────────────────────
  // État filtres
  // ─────────────────────────────────────────────
  const [preset, setPreset] = useState(30);
  const [from, setFrom] = useState(getDateRange(30).from);
  const [to, setTo] = useState(getDateRange(30).to);
  const [search, setSearch] = useState('');
  const [granularity, setGranularity] = useState('day');

  // ─────────────────────────────────────────────
  // État données
  // ─────────────────────────────────────────────
  const [ventes, setVentes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Modal détail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─────────────────────────────────────────────
  // Preset → from/to
  // ─────────────────────────────────────────────
  const applyPreset = (p) => {
    setPreset(p);
    const range = getDateRange(p);
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
  };

  // ─────────────────────────────────────────────
  // Fetch ventes
  // ─────────────────────────────────────────────
  const fetchVentes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentApi.ventes({
        page,
        limit: 20,
        from,
        to,
        search: search || undefined,
        sort: 'date',
        order: 'desc',
      });
      setVentes(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur chargement ventes');
    } finally {
      setLoading(false);
    }
  }, [page, from, to, search]);

  // ─────────────────────────────────────────────
  // Fetch stats
  // ─────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await agentApi.stats({ from, to, granularity });
      setStats(data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingStats(false);
    }
  }, [from, to, granularity]);

  useEffect(() => { fetchVentes(); }, [fetchVentes]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ─────────────────────────────────────────────
  // Détail
  // ─────────────────────────────────────────────
  const openDetail = async (vente) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await agentApi.vente(vente.id);
      setDetail(res.vente);
    } catch (err) {
      toast.error('Erreur chargement détail');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Reset filtres
  // ─────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('');
    setPreset(30);
    const range = getDateRange(30);
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
  };

  // ─────────────────────────────────────────────
  // Colonnes tableau
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'reference',
      label: 'Référence',
      render: (r) => <span className="font-mono text-xs">{r.reference}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => (
        <div>
          <div className="text-sm">{formatDate(r.created_at)}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(r.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'boutique_name',
      label: 'Boutique',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Store size={12} className="text-slate-400" /> {r.boutique_name}
        </span>
      ),
    },
    {
      key: 'nb_lignes',
      label: 'Articles',
      align: 'center',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
          {r.nb_lignes}
        </span>
      ),
    },
    {
      key: 'total_vente',
      label: 'Vente',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-slate-800">{formatCFA(r.total_vente)}</span>
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
      key: 'marge_pourcentage',
      label: '%',
      align: 'right',
      render: (r) => {
        const pct = r.marge_pourcentage || 0;
        const color =
          pct >= 30 ? 'text-emerald-600' : pct >= 15 ? 'text-amber-600' : 'text-slate-500';
        return <span className={`text-xs font-semibold ${color}`}>{formatPercent(pct)}</span>;
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); openDetail(r); }}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          title="Voir détail"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // Données graphiques
  // ─────────────────────────────────────────────
  const evolutionData = useMemo(
    () =>
      (stats?.evolution || []).map((e) => ({
        period: e.period,
        ca: e.ca || 0,
        marge: e.marge || 0,
        nb_ventes: e.nb_ventes || 0,
      })),
    [stats]
  );

  const categoriesData = useMemo(
    () =>
      (stats?.top_categories || []).map((c, i) => ({
        name: c.name,
        value: c.ca,
        color: c.color || COLOR_PALETTE[i % COLOR_PALETTE.length],
      })),
    [stats]
  );

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ═══════ EN-TÊTE ═══════ */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-brand-500" /> Mes performances
        </h1>
        <p className="text-sm text-slate-500">
          Analysez vos ventes et marges sur la période de votre choix
        </p>
      </div>

      {/* ═══════ BARRE FILTRES ═══════ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Période :</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${preset === p.days
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher (référence, boutique...)"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={12} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
            <span className="text-xs text-slate-500 px-2">Du</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="px-2 py-1 rounded border border-slate-200 text-xs bg-white"
            />
            <span className="text-xs text-slate-500 px-1">au</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="px-2 py-1 rounded border border-slate-200 text-xs bg-white"
            />
          </div>

          {(search || preset !== 30) && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ═══════ KPIs ═══════ */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-8 w-32 mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
      ) : stats?.kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Chiffre d'affaires"
            value={formatCFA(stats.kpis.total_vente)}
            icon={TrendingUp}
            color="blue"
            subtitle={`${stats.kpis.nb_ventes} vente(s)`}
          />
          <KPICard
            title="Marge totale"
            value={formatCFA(stats.kpis.total_marge)}
            icon={Wallet}
            color="emerald"
            subtitle={formatPercent(stats.kpis.marge_pourcentage)}
          />
          <KPICard
            title="Marge moyenne"
            value={formatCFA(stats.kpis.marge_moyenne)}
            icon={Receipt}
            color="violet"
            subtitle="par vente"
          />
          <KPICard
            title="Ventes"
            value={stats.kpis.nb_ventes}
            icon={Receipt}
            color="amber"
            subtitle={`Du ${formatDate(from)} au ${formatDate(to)}`}
          />
        </div>
      ) : null}

      {/* ═══════ GRAPHIQUES ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-500" />
              Évolution sur la période
            </h2>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
            >
              <option value="day">Par jour</option>
              <option value="week">Par semaine</option>
              <option value="month">Par mois</option>
            </select>
          </div>

          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => {
                    if (granularity === 'month') return v;
                    const d = new Date(v);
                    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v, name) => [formatCFA(v), name === 'ca' ? 'CA' : 'Marge']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ca" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} name="CA" />
                <Line type="monotone" dataKey="marge" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Marge" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Aucune donnée sur la période" icon={BarChart3} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Tag size={16} className="text-brand-500" />
            Par catégorie
          </h2>

          {categoriesData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoriesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categoriesData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCFA(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
                {categoriesData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate text-slate-600">{c.name}</span>
                    </div>
                    <span className="font-medium text-slate-800 flex-shrink-0">
                      {formatCFA(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Aucune catégorie" icon={Tag} />
          )}
        </div>
      </div>

      {/* ═══════ TOP BOUTIQUES + PRODUITS ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top boutiques */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Store size={16} className="text-brand-500" /> Top boutiques
          </h2>
          {stats?.top_boutiques?.length > 0 ? (
            <div className="space-y-2">
              {stats.top_boutiques.map((b, i) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{b.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold text-slate-800">
                      {formatCFA(b.ca)}
                    </div>
                    <div className="text-[10px] text-emerald-600">
                      {formatCFA(b.marge)} • {b.nb_ventes} vente(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune boutique" icon={Store} />
          )}
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Package size={16} className="text-brand-500" /> Top produits
          </h2>
          {stats?.top_produits?.length > 0 ? (
            <div className="space-y-2">
              {stats.top_produits.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm text-slate-700 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.reference}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold text-slate-800">
                      {formatCFA(p.marge)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Qté : {p.quantite}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun produit" icon={Package} />
          )}
        </div>
      </div>

      {/* ═══════ LISTE DES VENTES ═══════ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Receipt size={16} className="text-brand-500" />
            Détail des ventes ({total})
          </h2>
        </div>

        <DataTable
          columns={columns}
          data={ventes}
          loading={loading}
          emptyTitle="Aucune vente sur la période"
          emptyMessage="Modifiez les filtres ou changez la période"
        />

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ═══════ MODAL DÉTAIL ═══════ */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetail(null); }}
        title="Détail de la vente"
        size="lg"
      >
        {detailLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Header vente */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Référence</p>
                <p className="font-mono font-semibold text-slate-800">{detail.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(detail.created_at)} à{' '}
                  {new Date(detail.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Infos boutique + commande */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500">Boutique</p>
                <p className="text-sm font-medium text-slate-800">{detail.boutique_name}</p>
                {detail.boutique_address && (
                  <p className="text-xs text-slate-500">{detail.boutique_address}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Commande</p>
                <p className="text-sm font-mono text-slate-700">{detail.commande_ref}</p>
                {detail.valideur_name && (
                  <p className="text-xs text-slate-500">Validée par {detail.valideur_name}</p>
                )}
              </div>
            </div>

            {/* Lignes */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-slate-600 uppercase">Produit</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-600 uppercase">Qté</th>
                    <th className="text-right px-3 py-2 text-xs text-slate-600 uppercase">Prix unitaire</th>
                    <th className="text-right px-3 py-2 text-xs text-slate-600 uppercase">Marge unitaire</th>
                    <th className="text-right px-3 py-2 text-xs text-slate-600 uppercase">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detail.lignes?.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{l.produit_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{l.produit_ref}</div>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{l.quantite}</td>
                      <td className="px-3 py-2 text-right">{formatCFA(l.prix_vente_applique)}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">
                        {formatCFA(l.marge_unitaire)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {formatCFA(l.prix_vente_applique * l.quantite)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-slate-700">
                      Total vente
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCFA(detail.total_vente)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-emerald-700">
                      Total marge
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">
                      {formatCFA(detail.total_marge)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-slate-500 text-xs">
                      Marge %
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600 text-sm">
                      {formatPercent(detail.marge_pourcentage || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => { setDetailOpen(false); setDetail(null); }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
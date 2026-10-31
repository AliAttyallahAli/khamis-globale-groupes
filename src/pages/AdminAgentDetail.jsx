// frontend/src/pages/AdminAgentDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, ShieldCheck,
  ShieldOff, TrendingUp, Wallet, Receipt, Store, Package,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

import { adminAgentsApi } from '../api/admin-agents.api';
import { formatCFA, formatDate, formatPercent } from '../utils/formatters';

import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import KPICard from '../components/dashboard/KPICard';
import EmptyState from '../components/ui/EmptyState';

export default function AdminAgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminAgentsApi.get(id);
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
      navigate('/admin/agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  // ─────────────────────────────────────────────
  // Toggle actif
  // ─────────────────────────────────────────────
  const handleToggle = async () => {
    if (!confirm(`Changer le statut de "${data.agent.fullname}" ?`)) return;
    setToggling(true);
    try {
      const res = await adminAgentsApi.toggleActive(id);
      toast.success(res.message);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setToggling(false);
    }
  };

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  }

  if (!data) return null;

  const { agent, stats, boutiques, top_produits, dernieres_ventes, evolution } = data;

  const evolutionData = (evolution || []).map((e) => ({
    period: e.period,
    ca: e.ca || 0,
    marge: e.marge || 0,
    nb_ventes: e.nb_ventes || 0,
  }));

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Retour */}
      <button
        onClick={() => navigate('/admin/agents')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Retour aux agents
      </button>

      {/* ═══════ EN-TÊTE ═══════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0
                ${agent.is_active
                  ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white'
                  : 'bg-slate-200 text-slate-500'}`}
            >
              {agent.fullname?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{agent.fullname}</h1>
                <Badge color={agent.is_active ? 'emerald' : 'slate'}>
                  {agent.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {agent.phone}
                </div>
                {agent.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> {agent.email}
                  </div>
                )}
                {(agent.province || agent.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    {[agent.province, agent.city].filter(Boolean).join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> Inscrit le{' '}
                  {formatDate(agent.created_at)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              ${agent.is_active
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}
              disabled:opacity-50`}
          >
            {agent.is_active ? (
              <>
                <ShieldOff size={16} /> Désactiver l'agent
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Activer l'agent
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════ KPIs ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'affaires"
          value={formatCFA(stats.total_ca)}
          icon={TrendingUp}
          color="blue"
          subtitle={`${stats.nb_ventes} vente(s)`}
        />
        <KPICard
          title="Marge totale"
          value={formatCFA(stats.total_marge)}
          icon={Wallet}
          color="emerald"
          subtitle={formatPercent(stats.marge_pourcentage)}
        />
        <KPICard
          title="Boutiques"
          value={boutiques?.length || 0}
          icon={Store}
          color="violet"
          subtitle="fréquentées"
        />
        <KPICard
          title="Produits vendus"
          value={top_produits?.length || 0}
          icon={Package}
          color="amber"
          subtitle="différents"
        />
      </div>

      {/* ═══════ ÉVOLUTION ═══════ */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-brand-500" />
          Évolution sur les 30 derniers jours
        </h2>

        {evolutionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => {
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
              <Line type="monotone" dataKey="ca" stroke="#1e3a5f" strokeWidth={2} name="CA" />
              <Line type="monotone" dataKey="marge" stroke="#10b981" strokeWidth={2} name="Marge" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Aucune vente sur les 30 derniers jours" icon={BarChart3} />
        )}
      </div>

      {/* ═══════ BOUTIQUES + PRODUITS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Boutiques */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Store size={16} className="text-brand-500" /> Boutiques fréquentées
          </h2>
          {boutiques?.length > 0 ? (
            <div className="space-y-2">
              {boutiques.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{b.name}</div>
                    <div className="text-xs text-slate-500">{b.nb_ventes} vente(s)</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold text-slate-800">{formatCFA(b.ca)}</div>
                    <div className="text-xs text-emerald-600">{formatCFA(b.marge)}</div>
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
            <Package size={16} className="text-brand-500" /> Top produits vendus
          </h2>
          {top_produits?.length > 0 ? (
            <div className="space-y-2">
              {top_produits.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.reference}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold text-slate-800">{formatCFA(p.ca)}</div>
                    <div className="text-xs text-slate-500">Qté : {p.quantite}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun produit vendu" icon={Package} />
          )}
        </div>
      </div>

      {/* ═══════ DERNIÈRES VENTES ═══════ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Receipt size={16} className="text-brand-500" /> Dernières ventes
          </h2>
        </div>

        {dernieres_ventes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Référence</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Date</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Boutique</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-600 uppercase">Vente</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-600 uppercase">Marge</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-600 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dernieres_ventes.map((v) => {
                  const pct = v.marge_pourcentage || 0;
                  const pctColor =
                    pct >= 30
                      ? 'text-emerald-600'
                      : pct >= 15
                      ? 'text-amber-600'
                      : 'text-slate-500';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="font-mono text-xs text-slate-800">{v.reference}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.commande_ref}</div>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-xs">
                        {formatDate(v.created_at)}
                      </td>
                      <td className="px-4 py-2 text-slate-700 text-sm">{v.boutique_name}</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-800">
                        {formatCFA(v.total_vente)}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-semibold">
                        {formatCFA(v.total_marge)}
                      </td>
                      <td className={`px-4 py-2 text-right text-xs font-semibold ${pctColor}`}>
                        {formatPercent(pct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8">
            <EmptyState title="Aucune vente enregistrée" icon={Receipt} />
          </div>
        )}
      </div>
    </div>
  );
}
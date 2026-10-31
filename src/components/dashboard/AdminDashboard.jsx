// frontend/src/components/dashboard/AdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Wallet, ShoppingBag, Package, Users, Store,
  AlertTriangle, RefreshCw, Calendar,
} from 'lucide-react';
import { dashboardsApi } from '../../api/dashboards.api';
import { formatCFA } from '../../utils/formatters';
import KPICard from './KPICard';
import LineChartCard from '../charts/LineChartCard';
import BarChartCard from '../charts/BarChartCard';
import PieChartCard from '../charts/PieChartCard';
import Spinner from '../ui/Spinner';

const PERIODS = [
  { key: '7d', label: '7 jours', days: 7 },
  { key: '30d', label: '30 jours', days: 30 },
  { key: '90d', label: '90 jours', days: 90 },
  { key: 'all', label: 'Tout', days: null },
];

function getDateRange(days) {
  if (!days) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRange(PERIODS.find((p) => p.key === period)?.days);
      const result = await dashboardsApi.admin(range);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={36} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert-danger">
        <AlertTriangle size={20} />
        <p>Impossible de charger le tableau de bord.</p>
      </div>
    );
  }

  const { kpis, organisation, stock, top_boutiques, top_produits, evolution_ventes, evolution_charges, repartition_categories } = data;

  // Fusionner évolution ventes + charges pour LineChart
  const evolutionData = mergeEvolution(evolution_ventes, evolution_charges);

  // Catégories pour PieChart
  const categoriesData = (repartition_categories || []).map((c) => ({
    name: c.name,
    value: c.ca || 0,
    color: c.color,
  }));

  // Top boutiques pour BarChart
  const boutiquesData = (top_boutiques || []).map((b) => ({
    name: b.name.length > 20 ? b.name.slice(0, 20) + '…' : b.name,
    ca: b.ca || 0,
    marge: b.marge || 0,
  }));

  // Top produits pour BarChart
  const produitsData = (top_produits || []).map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    marge: p.marge_totale || 0,
  }));

  return (
    <div className="space-y-6">
      {/* En-tête + filtre période */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord Admin</h1>
          <p className="text-sm text-slate-500">Vue consolidée du groupe</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <div className="inline-flex p-1 bg-white rounded-lg border border-slate-200">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${period === p.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'affaires"
          value={formatCFA(kpis.ca_total)}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${kpis.nb_ventes} vente(s)`}
        />
        <KPICard
          title="Marge totale"
          value={formatCFA(kpis.marge_totale)}
          icon={Wallet}
          color="brand"
          subtitle={`${kpis.marge_pourcentage}% du CA`}
        />
        <KPICard
          title="Bénéfice net"
          value={formatCFA(kpis.benefice_net)}
          icon={ShoppingBag}
          color={kpis.benefice_net >= 0 ? 'emerald' : 'red'}
          subtitle={`Charges: ${formatCFA(kpis.charges_totales)}`}
        />
        <KPICard
          title="Alertes stock"
          value={stock.nb_alertes}
          icon={Package}
          color={stock.nb_alertes > 0 ? 'amber' : 'slate'}
          subtitle={`${stock.stock_total} unités`}
        />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Boutiques" value={organisation.nb_boutiques} icon={Store} color="blue" />
        <KPICard title="Catégories" value={organisation.nb_categories} icon={Package} color="violet" />
        <KPICard title="Agents" value={organisation.nb_agents} icon={Users} color="brand" />
        <KPICard title="Gérants" value={organisation.nb_gerants} icon={Users} color="amber" />
        <KPICard title="Personnel" value={organisation.nb_personnel} icon={Users} color="emerald" />
      </div>

      {/* Graphiques ligne - évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard
          title="Évolution des ventes"
          subtitle="CA et marge par jour"
          data={evolutionData}
          lines={[
            { key: 'ca', label: 'CA', color: '#10b981' },
            { key: 'marge', label: 'Marge', color: '#1e3a5f' },
          ]}
        />
        <LineChartCard
          title="Charges vs Bénéfice"
          subtitle="Comparaison dépenses / bénéfices"
          data={evolutionData}
          lines={[
            { key: 'charges', label: 'Charges', color: '#ef4444' },
            { key: 'benefice', label: 'Bénéfice', color: '#8b5cf6' },
          ]}
        />
      </div>

      {/* Graphiques barres - top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard
          title="Top 5 boutiques"
          subtitle="Chiffre d'affaires par boutique"
          data={boutiquesData}
          bars={[
            { key: 'ca', label: 'CA', color: '#1e3a5f' },
            { key: 'marge', label: 'Marge', color: '#10b981' },
          ]}
          layout="horizontal"
          xKey="name"
        />
        <BarChartCard
          title="Top 5 produits"
          subtitle="Marge totale par produit"
          data={produitsData}
          bars={[{ key: 'marge', label: 'Marge', color: '#10b981' }]}
          layout="horizontal"
          xKey="name"
          colorful
        />
      </div>

      {/* Répartition catégories - Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <PieChartCard
            title="Répartition par catégorie"
            subtitle="CA par catégorie"
            data={categoriesData}
            dataKey="value"
            nameKey="name"
          />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Résumé financier
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-sm font-medium text-emerald-900">CA total</span>
                <span className="text-lg font-bold text-emerald-700">{formatCFA(kpis.ca_total)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-50 border border-brand-200">
                <span className="text-sm font-medium text-brand-900">Marge</span>
                <span className="text-lg font-bold text-brand-700">{formatCFA(kpis.marge_totale)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <span className="text-sm font-medium text-red-900">Charges</span>
                <span className="text-lg font-bold text-red-700">− {formatCFA(kpis.charges_totales)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 border border-violet-200">
                <span className="text-sm font-medium text-violet-900">Bénéfice net</span>
                <span className={`text-lg font-bold ${kpis.benefice_net >= 0 ? 'text-violet-700' : 'text-red-700'}`}>
                  {formatCFA(kpis.benefice_net)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fusionne les évolutions ventes + charges sur une même timeline
function mergeEvolution(ventes = [], charges = []) {
  const map = new Map();

  (ventes || []).forEach((v) => {
    map.set(v.period, {
      period: v.period,
      ca: v.ca || 0,
      marge: v.marge || 0,
      charges: 0,
      benefice: v.marge || 0,
    });
  });

  (charges || []).forEach((c) => {
    const existing = map.get(c.period) || {
      period: c.period,
      ca: 0,
      marge: 0,
      charges: 0,
      benefice: 0,
    };
    existing.charges = c.total || 0;
    existing.benefice = (existing.marge || 0) - (c.total || 0);
    map.set(c.period, existing);
  });

  return Array.from(map.values())
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-30); // 30 derniers jours max
}
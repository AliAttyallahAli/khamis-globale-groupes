// frontend/src/components/dashboard/AgentDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, Wallet, Clock, Package, RefreshCw,
  Calendar, Store, Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
];

export default function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = PERIODS.find((x) => x.key === period);
      const params = {};
      if (p?.days) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - p.days);
        params.from = from.toISOString().slice(0, 10);
        params.to = to.toISOString().slice(0, 10);
      }
      const result = await dashboardsApi.agent(params);
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

  if (!data) return null;

  const { kpis, top_produits, evolution, mes_boutiques } = data;

  // Préparer données produits
  const produitsData = (top_produits || []).map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
    marge: p.marge || 0,
    quantite: p.quantite || 0,
  }));

  return (
    <div className="space-y-6">
      {/* En-tête + filtre */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mon tableau de bord</h1>
          <p className="text-sm text-slate-500">Mes ventes et marges personnelles</p>
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
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-slate-100">
            <RefreshCw size={16} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs personnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Mon CA" value={formatCFA(kpis.ca)} icon={TrendingUp} color="emerald" />
        <KPICard title="Ma marge" value={formatCFA(kpis.marge)} icon={Wallet} color="brand" />
        <KPICard title="Mes ventes" value={kpis.nb_ventes} icon={Package} color="blue" />
        <KPICard
          title="En attente"
          value={kpis.commandes_attente}
          icon={Clock}
          color={kpis.commandes_attente > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard
          title="Mon évolution"
          subtitle="CA et marge par jour"
          data={evolution || []}
          lines={[
            { key: 'ca', label: 'CA', color: '#10b981' },
            { key: 'marge', label: 'Marge', color: '#1e3a5f' },
          ]}
        />
        <BarChartCard
          title="Mes top produits"
          subtitle="Marge générée par produit"
          data={produitsData}
          bars={[{ key: 'marge', label: 'Marge', color: '#10b981' }]}
          layout="horizontal"
          xKey="name"
          colorful
        />
      </div>

      {/* Mes boutiques */}
      {mes_boutiques && mes_boutiques.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Store size={16} className="text-brand-500" />
            Mes boutiques ({mes_boutiques.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {mes_boutiques.map((b) => (
              <Link
                key={b.id}
                to={`/boutiques`}
                className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm
                           border border-brand-200 hover:bg-brand-100 transition-colors"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Badge encouragement */}
      {kpis.marge > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Trophy size={32} className="opacity-80" />
            <div>
              <p className="text-sm opacity-90">Bonne performance !</p>
              <p className="text-lg font-bold">
                Vous avez généré {formatCFA(kpis.marge)} de marge
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
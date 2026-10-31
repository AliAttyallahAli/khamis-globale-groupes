// frontend/src/components/dashboard/GerantDashboard.jsx
import { useEffect, useState } from 'react';
import { dashboardsApi } from '../../api/dashboards.api';
import { formatCFA } from '../../utils/formatters';
import KPICard from './KPICard';
import Spinner from '../ui/Spinner';
import { TrendingUp, Wallet, Clock, AlertCircle } from 'lucide-react';

export default function GerantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.gerant().then(setData).catch(console.warn).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const { kpis, commandes_attente, alertes_stock } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord Gérant</h1>
        <p className="text-sm text-slate-500">Vue de votre périmètre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="CA" value={formatCFA(kpis.ca)} icon={TrendingUp} color="emerald" />
        <KPICard title="Marge" value={formatCFA(kpis.marge)} icon={Wallet} color="brand" />
        <KPICard
          title="Commandes en attente"
          value={kpis.nb_commandes_attente}
          icon={Clock}
          color={kpis.nb_commandes_attente > 0 ? 'amber' : 'slate'}
        />
        <KPICard
          title="Alertes stock"
          value={alertes_stock.length}
          icon={AlertCircle}
          color={alertes_stock.length > 0 ? 'red' : 'slate'}
        />
      </div>

      {commandes_attente.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Commandes à valider ({commandes_attente.length})
          </h2>
          <div className="space-y-2">
            {commandes_attente.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{c.reference}</p>
                  <p className="text-xs text-slate-500">
                    {c.agent_name} • {c.boutique_name}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatCFA(c.total_vente)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
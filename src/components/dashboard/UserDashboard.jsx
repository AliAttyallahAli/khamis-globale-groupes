// frontend/src/components/dashboard/UserDashboard.jsx
import { useEffect, useState } from 'react';
import { Store, Tags, Package, TrendingUp } from 'lucide-react';
import { dashboardsApi } from '../../api/dashboards.api';
import KPICard from './KPICard';
import Spinner from '../ui/Spinner';

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.user()
      .then(setData)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size={36} /></div>;
  if (!data) return null;

  const { compteurs } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bienvenue</h1>
        <p className="text-sm text-slate-500">Découvrez notre catalogue de produits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Boutiques" value={compteurs.nb_boutiques} icon={Store} color="blue" />
        <KPICard title="Catégories" value={compteurs.nb_categories} icon={Tags} color="violet" />
        <KPICard title="Produits" value={compteurs.nb_produits} icon={Package} color="brand" />
      </div>

      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl p-8 text-white">
        <h2 className="text-xl font-bold mb-2">Découvrez khamis GLOBALE GROUPES</h2>
        <p className="text-sm opacity-90">
          Parcourez notre catalogue de produits, découvrez nos boutiques et nos agents partenaires.
        </p>
      </div>
    </div>
  );
}
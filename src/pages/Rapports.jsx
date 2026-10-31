// frontend/src/pages/Rapports.jsx
import { useState } from 'react';
import {
  FileBarChart2, FileText, FileSpreadsheet, Download,
  Filter, Calendar, Info, TrendingUp, Users, Package, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { rapportsApi } from '../api/rapports.api';
import { boutiquesApi } from '../api/boutiques.api';
import { useRole } from '../hooks/useRole';
import { useFilters } from '../hooks/useFilters';
import { Button, Input, Select, Badge } from '../components/ui';

const RAPPORTS = [
  {
    key: 'ventes',
    label: 'Ventes',
    description: 'CA, marges, agents, boutiques',
    icon: TrendingUp,
    color: 'emerald',
    fields: ['from', 'to', 'boutique_id'],
  },
  {
    key: 'charges',
    label: 'Charges',
    description: 'Dépenses par type et moyen de paiement',
    icon: CreditCard,
    color: 'amber',
    fields: ['from', 'to', 'boutique_id'],
  },
  {
    key: 'produits',
    label: 'Produits & Stock',
    description: 'Inventaire, prix, marges, seuils',
    icon: Package,
    color: 'blue',
    fields: ['boutique_id'],
  },
  {
    key: 'personnel',
    label: 'Personnel',
    description: 'Liste, salaires, contrats',
    icon: Users,
    color: 'violet',
    fields: ['statut'],
  },
];

const COLORS = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'bg-amber-500' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    icon: 'bg-blue-500' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  icon: 'bg-violet-500' },
};

export default function Rapports() {
  const { isAdmin, isGerant, isAgent } = useRole();
  const [boutiques, setBoutiques] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const filters = useFilters({
    from: '',
    to: '',
    boutique_id: '',
    statut: 'all',
  });

  // Charger les boutiques
  useState(() => {
    boutiquesApi.list({ is_active: 1, limit: 500 })
      .then((d) => setBoutiques(d.data || []))
      .catch(console.warn);
  }, []);

  const download = async (rapport, format) => {
    setDownloading(`${rapport.key}-${format}`);
    try {
      const params = { format };
      const f = filters.values;

      if (rapport.fields.includes('from') && f.from) params.from = f.from;
      if (rapport.fields.includes('to') && f.to) params.to = f.to;
      if (rapport.fields.includes('boutique_id') && f.boutique_id) params.boutique_id = f.boutique_id;
      if (rapport.fields.includes('statut') && f.statut !== 'all') params.statut = f.statut;

      const ext = format === 'xlsx' ? 'xlsx' : format;
      const filename = `${rapport.key}-${Date.now()}.${ext}`;

      await rapportsApi.download(rapport.endpoint || `/rapports/${rapport.key}`, params, filename);
      toast.success(`${rapport.label} exporté en ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export');
    } finally {
      setDownloading(null);
    }
  };

  const resetFilters = () => {
    filters.reset();
    toast('Filtres réinitialisés', { icon: '↩️' });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart2 className="text-brand-500" /> Rapports & Exports
          </h1>
          <p className="text-sm text-slate-500">
            Générez vos rapports en PDF, Excel ou SVG
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Filter size={14} /> {showFilters ? 'Masquer' : 'Afficher'} les filtres
        </button>
      </div>

      {/* Bannière info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Comment exporter un rapport ?</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Définissez la période (dates) si nécessaire</li>
            <li>Sélectionnez une boutique pour filtrer (optionnel)</li>
            <li>Cliquez sur <strong>PDF</strong>, <strong>Excel</strong> ou <strong>SVG</strong> pour télécharger</li>
          </ol>
        </div>
      </div>

      {/* Filtres globaux */}
      {showFilters && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-800">Filtres globaux</h3>
            {filters.hasActiveFilters && (
              <Badge color="amber">{filters.activeCount} actif(s)</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Du
              </label>
              <input
                type="date"
                value={filters.values.from}
                onChange={(e) => filters.set('from', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Au
              </label>
              <input
                type="date"
                value={filters.values.to}
                onChange={(e) => filters.set('to', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Boutique</label>
              <select
                value={filters.values.boutique_id}
                onChange={(e) => filters.set('boutique_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">Toutes les boutiques</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Statut (personnel)</label>
              <select
                value={filters.values.statut}
                onChange={(e) => filters.set('statut', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="all">Tous</option>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="sorti">Sorti</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* Cartes de rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RAPPORTS.map((r) => {
          const Icon = r.icon;
          const cfg = COLORS[r.color];
          return (
            <div key={r.key} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${cfg.icon} text-white flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">{r.label}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => download(r, 'pdf')}
                  disabled={downloading === `${r.key}-pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50 transition-colors"
                >
                  <FileText size={14} />
                  {downloading === `${r.key}-pdf` ? 'Export...' : 'PDF'}
                </button>
                <button
                  onClick={() => download(r, 'xlsx')}
                  disabled={downloading === `${r.key}-xlsx`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium disabled:opacity-50 transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  {downloading === `${r.key}-xlsx` ? 'Export...' : 'Excel'}
                </button>
                <button
                  onClick={() => download(r, 'svg')}
                  disabled={downloading === `${r.key}-svg`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium disabled:opacity-50 transition-colors"
                >
                  <Download size={14} />
                  {downloading === `${r.key}-svg` ? 'Export...' : 'SVG'}
                </button>
              </div>

              {r.fields.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                  <Filter size={10} /> Filtres appliqués : {r.fields.join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Aide en bas */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-slate-600">
          <strong>💡 Astuce :</strong> Si aucune période n'est spécifiée, le rapport inclut <strong>toutes les données disponibles</strong>.
          Pour de meilleures performances, limitez à 30-90 jours.
        </p>
      </div>
    </div>
  );
}
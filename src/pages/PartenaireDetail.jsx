// frontend/src/pages/PartenaireDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  ShoppingBag, TrendingUp, AlertTriangle, Star,
  Package, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { partenairesApi } from '../api/partenaires.api';
import { formatCFA, formatDate } from '../utils/formatters';

import Badge from '../components/ui/Badge';
import KPICard from '../components/dashboard/KPICard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function PartenaireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    partenairesApi
      .get(id)
      .then((res) => setData(res))
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Erreur');
        navigate('/partenaires');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  }

  if (!data) return null;

  const { partenaire, stats, achats, top_produits } = data;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <button
        onClick={() => navigate('/partenaires')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Retour aux partenaires
      </button>

      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {partenaire.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{partenaire.name}</h1>
                <Badge color={partenaire.is_active ? 'emerald' : 'slate'}>
                  {partenaire.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < (partenaire.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-mono">{partenaire.code}</span>
                {partenaire.company_name && ` • ${partenaire.company_name}`}
                {partenaire.category && ` • ${partenaire.category}`}
              </p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {partenaire.phone}
                  {partenaire.phone_secondary && (
                    <span className="text-slate-500">• {partenaire.phone_secondary}</span>
                  )}
                </div>
                {partenaire.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> {partenaire.email}
                  </div>
                )}
                {(partenaire.city || partenaire.province) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    {[partenaire.address, partenaire.city, partenaire.province]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> Partenaire depuis{' '}
                  {formatDate(partenaire.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions commerciales */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase">Délai paiement</p>
            <p className="font-medium text-slate-800">{partenaire.payment_terms}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Plafond crédit</p>
            <p className="font-medium text-slate-800">
              {formatCFA(partenaire.credit_limit || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Remise</p>
            <p className="font-medium text-slate-800">{partenaire.discount_rate || 0}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">NIF</p>
            <p className="font-medium text-slate-800 font-mono">
              {partenaire.tax_id || '—'}
            </p>
          </div>
        </div>

        {partenaire.notes && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Notes</p>
            <p className="text-sm text-slate-700">{partenaire.notes}</p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total achats"
          value={stats?.total_achats || 0}
          icon={ShoppingBag}
          color="brand"
        />
        <KPICard
          title="Montant total"
          value={formatCFA(stats?.total_montant || 0)}
          icon={TrendingUp}
          color="violet"
        />
        <KPICard
          title="Payé"
          value={formatCFA(stats?.total_paye || 0)}
          icon={CreditCard}
          color="emerald"
        />
        <KPICard
          title="Reste à payer"
          value={formatCFA(stats?.montant_du || 0)}
          icon={AlertTriangle}
          color={stats?.montant_du > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Top produits + Achats récents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top produits fournis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Package size={16} className="text-brand-500" /> Top produits fournis
          </h2>
          {top_produits?.length > 0 ? (
            <div className="space-y-2">
              {top_produits.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.reference}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs font-semibold text-slate-800">
                      {formatCFA(p.total_achats)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Qté: {p.quantite_totale}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun produit fourni" icon={Package} />
          )}
        </div>

        {/* Achats récents */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ShoppingBag size={16} className="text-brand-500" /> Achats récents
            </h2>
          </div>
          {achats?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-slate-600 uppercase">Réf.</th>
                    <th className="text-left px-3 py-2 text-xs text-slate-600 uppercase">Date</th>
                    <th className="text-left px-3 py-2 text-xs text-slate-600 uppercase">Produit</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-600 uppercase">Qté</th>
                    <th className="text-right px-3 py-2 text-xs text-slate-600 uppercase">Total</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-600 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {achats.map((a) => {
                    const statutColors = {
                      paye: 'emerald',
                      partiel: 'amber',
                      impaye: 'red',
                    };
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">
                          {a.reference}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {formatDate(a.date_achat)}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-700">
                          {a.produit_name || '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">{a.quantite}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold">
                          {formatCFA(a.total)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge color={statutColors[a.statut_paiement] || 'slate'}>
                            {a.statut_paiement}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8">
              <EmptyState title="Aucun achat enregistré" icon={ShoppingBag} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
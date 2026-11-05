// frontend/src/pages/AdminLivreurDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bike, Phone, Mail, MapPin, Calendar, Truck,
  CheckCircle2, XCircle, Clock, TrendingUp, Package, Wallet,
  Edit, ShieldOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { livreursApi } from '../api/livreurs.api';
import { livraisonsApi } from '../api/livraisons.api';
import { formatCFA, formatDate, formatDateTime } from '../utils/formatters';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import KPICard from '../components/dashboard/KPICard';
import EmptyState from '../components/ui/EmptyState';

const VEHICLE_ICONS = {
  moto: Bike,
  voiture: Truck,
  velo: Bike,
  camion: Truck,
  pied: Package,
};

export default function AdminLivreurDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Modal marquer livrée / échouée
  const [statusModal, setStatusModal] = useState(null);
  const [reason, setReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await livreursApi.get(id);
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
      navigate('/admin/livreurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  // ─────────────────────────────────────────────
  // Changer statut livraison
  // ─────────────────────────────────────────────
  const handleUpdateStatut = async (livraisonId, statut) => {
    setUpdating(livraisonId);
    try {
      await livraisonsApi.updateStatut(livraisonId, {
        statut,
        raison: statut === 'echouee' ? reason : undefined,
      });
      toast.success(`Livraison marquée comme ${statut === 'livree' ? 'livrée' : 'échouée'}`);
      setStatusModal(null);
      setReason('');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setUpdating(null);
    }
  };

  // ─────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={40} />
      </div>
    );
  }

  if (!data) return null;

  const { livreur, stats, livraisons } = data;
  const VehicleIcon = VEHICLE_ICONS[livreur.vehicle] || Bike;

  const statutColors = {
    en_cours: 'amber',
    livree: 'emerald',
    echouee: 'red',
    annulee: 'slate',
  };
  const statutLabels = {
    en_cours: 'En cours',
    livree: 'Livrée',
    echouee: 'Échouée',
    annulee: 'Annulée',
  };

  return (
    <div className="space-y-6">
      {/* Retour */}
      <button
        onClick={() => navigate('/admin/livreurs')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Retour aux livreurs
      </button>

      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                ${livreur.is_active
                  ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white'
                  : 'bg-slate-200 text-slate-500'}`}
            >
              <VehicleIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{livreur.fullname}</h1>
                <Badge color={livreur.is_active ? 'emerald' : 'slate'}>
                  {livreur.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {livreur.phone}
                </div>
                {livreur.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> {livreur.email}
                  </div>
                )}
                {livreur.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" /> {livreur.address}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-slate-400" />
                  {livreur.vehicle || 'Véhicule non précisé'}
                  {livreur.vehicle_plate && ` • ${livreur.vehicle_plate}`}
                </div>
                {livreur.zone && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" /> Zone : {livreur.zone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> Inscrit le{' '}
                  {formatDate(livreur.created_at)}
                </div>
              </div>
            </div>
          </div>

          {livreur.notes && (
            <div className="max-w-sm bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-slate-700">{livreur.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total livraisons"
          value={stats.total_livraisons || 0}
          icon={Package}
          color="blue"
        />
        <KPICard
          title="Livrées"
          value={stats.livrees || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle={stats.total_livraisons > 0
            ? `${Math.round((stats.livrees / stats.total_livraisons) * 100)}% de réussite`
            : '—'}
        />
        <KPICard
          title="En cours"
          value={stats.en_cours || 0}
          icon={Clock}
          color="amber"
        />
        <KPICard
          title="Frais totaux"
          value={formatCFA(stats.total_frais || 0)}
          icon={Wallet}
          color="violet"
        />
      </div>

      {/* Livraisons */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Truck size={16} className="text-brand-500" />
            Historique des livraisons ({livraisons?.length || 0})
          </h2>
        </div>

        {livraisons && livraisons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Référence</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Commande</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Adresse</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Destinataire</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-600 uppercase">Frais</th>
                  <th className="text-center px-4 py-2 text-xs text-slate-600 uppercase">Statut</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-600 uppercase">Date</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {livraisons.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs text-slate-800">{l.reference}</div>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600 font-mono">
                      {l.commande_ref}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      <div className="text-sm truncate max-w-[200px]" title={l.adresse}>
                        {l.adresse}
                      </div>
                      <div className="text-xs text-slate-500">{l.boutique_name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-slate-700">{l.destinataire || '—'}</div>
                      {l.telephone && (
                        <div className="text-xs text-slate-500">{l.telephone}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700">
                      {formatCFA(l.frais || 0)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge color={statutColors[l.statut]}>
                        {statutLabels[l.statut]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l.statut === 'en_cours' && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleUpdateStatut(l.id, 'livree')}
                            disabled={updating === l.id}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 disabled:opacity-50"
                            title="Marquer livrée"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => { setStatusModal(l); setReason(''); }}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            title="Marquer échouée"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Aucune livraison"
            message="Ce livreur n'a pas encore effectué de livraison"
            icon={Truck}
          />
        )}
      </div>

      {/* Modal marquer échouée */}
      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setStatusModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-800 mb-3">Marquer la livraison comme échouée</h3>
            <p className="text-sm text-slate-500 mb-4">
              Livraison <strong>{statusModal.reference}</strong>
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700">Raison *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder="Ex: Client absent, adresse introuvable..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setStatusModal(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => handleUpdateStatut(statusModal.id, 'echouee')}
                disabled={!reason.trim() || updating === statusModal.id}
                loading={updating === statusModal.id}
              >
                Marquer échouée
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
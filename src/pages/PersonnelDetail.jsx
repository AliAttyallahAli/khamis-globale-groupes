// frontend/src/pages/PersonnelDetail.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Wallet, Phone, Briefcase, Mail,
  Calendar, Award, TrendingUp, FileText, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { personnelApi } from '../api/personnel.api';
import { paiementsApi } from '../api/paiements.api';
import { useRole } from '../hooks/useRole';
import { useModal } from '../hooks/useModal';
import { formatCFA, formatDate } from '../utils/formatters';
import { TYPES_PAIEMENT, MOYENS_PAIEMENT, STATUTS_PERSONNEL } from '../utils/constants';

import { Button, Modal, Badge, Spinner } from '../components/ui';
import { PaiementForm } from '../components/forms';
import { KPICard } from '../components/dashboard';

export default function PersonnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [personnel, setPersonnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const modal = useModal();

  // ═══════════════════════════════════════════════
  // Charger la fiche personnel
  // ═══════════════════════════════════════════════
  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const data = await personnelApi.get(id);
      setPersonnel(data.personnel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
      navigate('/personnel');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // ═══════════════════════════════════════════════
  // Créer un paiement
  // ═══════════════════════════════════════════════
  const handleCreatePaiement = async (formData) => {
    formData.append('personnel_id', id);

    setSaving(true);
    try {
      await paiementsApi.create(formData);
      toast.success('Paiement enregistré');
      modal.close();
      fetchPersonnel();
    } catch (err) {
      const details = err.response?.data?.details;
      if (Array.isArray(details)) {
        details.forEach((d) => toast.error(`${d.field} : ${d.message}`));
      } else {
        toast.error(err.response?.data?.error || 'Erreur');
      }
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════
  // Statistiques
  // ═══════════════════════════════════════════════
  const stats = personnel?.paiements?.reduce((acc, p) => {
    acc.total += p.montant || 0;
    if (p.type === 'salaire') acc.salaires += p.montant || 0;
    if (p.type === 'prime') acc.primes += p.montant || 0;
    if (p.type === 'avance') acc.avances += p.montant || 0;
    return acc;
  }, { total: 0, salaires: 0, primes: 0, avances: 0 }) || { total: 0, salaires: 0, primes: 0, avances: 0 };

  // ═══════════════════════════════════════════════
  // États
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={36} />
      </div>
    );
  }

  if (!personnel) return null;

  const statutCfg = STATUTS_PERSONNEL[personnel.statut] || { label: personnel.statut, color: 'slate' };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Fil d'Ariane + Retour */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/personnel" className="hover:text-slate-700">Personnel</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{personnel.fullname}</span>
      </div>

      <button
        onClick={() => navigate('/personnel')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Retour au personnel
      </button>

      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center text-2xl font-bold">
            {personnel.fullname?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{personnel.fullname}</h1>
            <p className="text-sm text-slate-500">{personnel.poste || 'Poste non défini'}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge color={statutCfg.color}>{statutCfg.label}</Badge>
              <Badge color="slate">{personnel.type_contrat}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => modal.open()}>
            <Plus size={16} /> Enregistrer un paiement
          </Button>
        </div>
      </div>

      {/* KPIs paiements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total payé" value={formatCFA(stats.total)} icon={Wallet} color="brand" />
        <KPICard title="Salaires" value={formatCFA(stats.salaires)} icon={TrendingUp} color="emerald" />
        <KPICard title="Primes" value={formatCFA(stats.primes)} icon={Award} color="violet" />
        <KPICard title="Avances" value={formatCFA(stats.avances)} icon={FileText} color="amber" />
      </div>

      {/* Infos personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-800">Contact</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500">Téléphone</span>
              <p className="font-medium">{personnel.phone || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Email</span>
              <p className="font-medium truncate">{personnel.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-800">Affectation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500">Département</span>
              <p className="font-medium">{personnel.departement_name || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Boutique</span>
              <p className="font-medium">{personnel.boutique_name || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-800">Contrat</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-500">Type</span>
              <p className="font-medium">{personnel.type_contrat}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Date d'embauche</span>
              <p className="font-medium">{personnel.date_embauche ? formatDate(personnel.date_embauche) : '—'}</p>
            </div>
            {isAdmin && (
              <div>
                <span className="text-xs text-slate-500">Salaire de base</span>
                <p className="font-bold text-brand-600">{formatCFA(personnel.salaire_base)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique paiements */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Wallet size={16} className="text-brand-500" />
              Historique des paiements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {personnel.paiements?.length || 0} paiement(s)
            </p>
          </div>
          <span className="text-sm text-emerald-600 font-bold">
            Total : {formatCFA(stats.total)}
          </span>
        </div>

        {!personnel.paiements || personnel.paiements.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Aucun paiement enregistré</p>
            <Button size="sm" onClick={() => modal.open()} className="mt-3">
              <Plus size={14} /> Enregistrer le premier paiement
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Moyen</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Justification</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Montant</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Pièce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personnel.paiements.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge color="violet">{p.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {MOYENS_PAIEMENT.find((m) => m.value === p.moyen_paiement)?.label || p.moyen_paiement}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[250px] truncate" title={p.justification}>
                      {p.justification}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatCFA(p.montant)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.piece_jointe ? (
                        <a
                          href={`http://localhost:9000/${p.piece_jointe}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 rounded hover:bg-slate-100 text-slate-600"
                          title="Voir la pièce"
                        >
                          <FileText size={14} />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal paiement */}
      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Enregistrer un paiement"
        size="md"
      >
        <PaiementForm
          personnel={personnel}
          onSubmit={handleCreatePaiement}
          onCancel={modal.close}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
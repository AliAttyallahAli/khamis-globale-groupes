// frontend/src/pages/AlkherPay.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Send, Wallet, RefreshCw, Receipt, Search, Lock,
  AlertTriangle, UserPlus, CheckCircle2, ArrowRight, Building2,
  Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { alkherpayApi } from '../api/alkherpay.api';
import { useAlkherPayPin } from '../hooks/useAlkherPayPin';
import { useAuth } from '../hooks/useAuth';
import { formatCFA, relativeTime } from '../utils/formatters';

import { Button, Input, Badge, Modal, Spinner } from '../components/ui';
import PinModal from '../components/ui/PinModal';
import SetPinModal from '../components/ui/SetPinModal';

// ═══════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════
const TABS = [
  { key: 'solde', label: 'Solde', icon: Wallet },
  { key: 'transfert', label: 'Transfert', icon: Send },
  { key: 'historique', label: 'Historique', icon: Receipt },
];

// ═══════════════════════════════════════════════
// CARTE DE SOLDE
// ═══════════════════════════════════════════════
function SoldeCard({ solde, loading, onRefresh }) {
  const [hidden, setHidden] = useState(false);

  if (loading) {
    return (
      <div className="relative w-full max-w-md aspect-[1.6/1] rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 shadow-2xl shadow-brand-500/30 flex items-center justify-center">
        <Spinner size={36} className="text-white" />
      </div>
    );
  }

  if (!solde) {
    return (
      <div className="relative w-full max-w-md aspect-[1.6/1] rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-xl flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Wallet size={28} className="text-white/60" />
        </div>
        <p className="text-white/80 text-sm">Solde non chargé</p>
        <Button onClick={onRefresh} variant="secondary" size="sm">
          <RefreshCw size={14} /> Charger
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md aspect-[1.6/1] rounded-3xl overflow-hidden shadow-2xl shadow-brand-500/30 group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-70 font-medium">
              Portefeuille AlkherPay
            </p>
            <p className="text-lg font-bold mt-1">khamis GLOBALE</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHidden(!hidden)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              title={hidden ? 'Afficher' : 'Masquer'}
            >
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={onRefresh}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
            Solde disponible
          </p>
          <p className="text-4xl font-black tracking-tight">
            {hidden ? '••••••' : formatCFA(solde.balance)}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-60">Titulaire</p>
            <p className="text-sm font-medium truncate max-w-[160px]">{solde.fullname}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider opacity-60">N°</p>
            <p className="text-sm font-mono font-medium">{solde.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LIGNE DE TRANSACTION
// ═══════════════════════════════════════════════
function TransactionRow({ transaction }) {
  const isDeposit = ['deposit', 'transfer_received'].includes(transaction.type);
  const isWithdraw = ['withdraw', 'transfer_sent', 'transfer'].includes(transaction.type);

  const config = isDeposit
    ? { color: 'text-emerald-600 bg-emerald-50', sign: '+' }
    : isWithdraw
    ? { color: 'text-red-600 bg-red-50', sign: '−' }
    : { color: 'text-slate-600 bg-slate-50', sign: '' };

  const statusConfig = {
    completed: { color: 'emerald', label: 'Complété' },
    pending:   { color: 'amber',   label: 'En attente' },
    failed:    { color: 'red',     label: 'Échoué' },
  };
  const status = statusConfig[transaction.status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
        {isDeposit ? <ArrowRight size={18} className="rotate-90" /> : <Send size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-800 capitalize">
            {transaction.type?.replace(/_/g, ' ')}
          </p>
          <Badge color={status.color}>{status.label}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {transaction.description || `Réf. ${transaction.reference}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-semibold ${isDeposit ? 'text-emerald-600' : isWithdraw ? 'text-red-600' : 'text-slate-800'}`}>
          {config.sign}{formatCFA(transaction.amount)}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {relativeTime(transaction.created_at)}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════
export default function AlkherPay() {
  const { user } = useAuth();
  const [tab, setTab] = useState('solde');

  const [solde, setSolde] = useState(null);
  const [loadingSolde, setLoadingSolde] = useState(true);
  const [linked, setLinked] = useState(true);
  const [requiresLink, setRequiresLink] = useState(false);

  const [historique, setHistorique] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [searchHist, setSearchHist] = useState('');

  const [transfertForm, setTransfertForm] = useState({
    receiver_phone: '',
    amount: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // PIN
  const pin = useAlkherPayPin();
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [createPinModalOpen, setCreatePinModalOpen] = useState(false);

  // Lien compte
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ alkherpay_phone: user?.phone || '' });
  const [linking, setLinking] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // ═══════════════════════════════════════════════
  // Chargements
  // ═══════════════════════════════════════════════
  const loadSolde = useCallback(async () => {
    setLoadingSolde(true);
    try {
      const res = await alkherpayApi.solde();
      setSolde(res.wallet);
      setLinked(res.linked !== false);
      setRequiresLink(res.requiresLink === true);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement du solde');
    } finally {
      setLoadingSolde(false);
    }
  }, []);

  const loadHist = useCallback(async () => {
    setLoadingHist(true);
    try {
      const res = await alkherpayApi.historique({ limit: 100 });
      setHistorique(res.transactions || []);
    } catch (err) {
      toast.error('Erreur historique');
    } finally {
      setLoadingHist(false);
    }
  }, []);

  useEffect(() => {
    loadSolde();
    pin.checkStatus();
  }, []);

  useEffect(() => {
    if (tab === 'historique' && historique === null) loadHist();
  }, [tab, historique, loadHist]);

  // ═══════════════════════════════════════════════
  // Lier un compte
  // ═══════════════════════════════════════════════
  const handleLink = async (e) => {
    e.preventDefault();
    setLinking(true);
    try {
      await alkherpayApi.link({ alkherpay_phone: linkForm.alkherpay_phone });
      toast.success('Compte AlkherPay lié !');
      setLinkModalOpen(false);
      await loadSolde();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de lier');
    } finally {
      setLinking(false);
    }
  };

  const handleRequestAccount = async () => {
    try {
      await alkherpayApi.requestAccount({ requested_phone: user?.phone });
      toast.success('Demande envoyée ! Un admin créera votre compte.');
      setRequestSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ═══════════════════════════════════════════════
  // Transfert
  // ═══════════════════════════════════════════════
  const handlePrepareTransfert = async (e) => {
    e.preventDefault();

    if (!linked) return toast.error('Compte AlkherPay non lié');
    if (!transfertForm.receiver_phone || !/^\d{8}$/.test(transfertForm.receiver_phone)) {
      return toast.error('Téléphone invalide');
    }
    if (!transfertForm.amount || parseInt(transfertForm.amount, 10) < 25) {
      return toast.error('Montant minimum 25 FCFA');
    }
    if (transfertForm.receiver_phone === solde?.phone) {
      return toast.error('Impossible de s\'envoyer à soi-même');
    }

    const hasPin = await pin.checkStatus();
    if (!hasPin) {
      setCreatePinModalOpen(true);
      return;
    }
    setPinModalOpen(true);
  };

  const handleConfirmTransfert = async (enteredPin) => {
    setSubmitting(true);
    try {
      const res = await alkherpayApi.transfert({
        receiver_phone: transfertForm.receiver_phone,
        amount: parseInt(transfertForm.amount, 10),
        pin: enteredPin,
        description: transfertForm.description,
      });
      toast.success(`✅ Transfert réussi : ${formatCFA(res.transaction?.amount || 0)}`, { duration: 5000 });
      setPinModalOpen(false);
      setTransfertForm({ receiver_phone: '', amount: '', description: '' });
      loadSolde();
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'NO_ALKHERPAY_ACCOUNT') {
        setPinModalOpen(false);
        setRequiresLink(true);
        setLinked(false);
        return toast.error('Compte AlkherPay non lié');
      }
      if (code === 'PIN_INVALID' || code === 'PIN_WRONG') return;
      if (code === 'PIN_BLOCKED') return;
      toast.error(err.response?.data?.error || 'Erreur');
      setPinModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPin = async (newPin, confirmPin) => {
    const result = await pin.set(newPin, confirmPin);
    if (result.ok) {
      setCreatePinModalOpen(false);
      setPinModalOpen(true);
    }
  };

  const filteredHist = (historique || []).filter((t) =>
    !searchHist || JSON.stringify(t).toLowerCase().includes(searchHist.toLowerCase())
  );

  // ═══════════════════════════════════════════════
  // RENDU : COMPTE NON LIÉ
  // ═══════════════════════════════════════════════
  if (!linked && requiresLink) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-brand-500" /> Portail AlkherPay
          </h1>
        </div>

        <div className="bg-white rounded-2xl border-2 border-amber-300 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Compte AlkherPay requis
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Pour effectuer des transferts et consulter votre solde, vous devez avoir un
            <strong> compte AlkherPay</strong> lié à votre profil.
          </p>

          <div className="space-y-3 max-w-sm mx-auto">
            <Button onClick={() => setLinkModalOpen(true)} className="w-full">
              <CheckCircle2 size={16} /> J'ai déjà un compte AlkherPay
            </Button>
            <Button
              variant="secondary"
              onClick={handleRequestAccount}
              disabled={requestSent}
              className="w-full"
            >
              <UserPlus size={16} />
              {requestSent ? 'Demande envoyée ✓' : 'Créer un compte AlkherPay'}
            </Button>
            {requestSent && (
              <p className="text-xs text-emerald-600 mt-2">
                ✅ Votre demande a été envoyée. Un admin créera votre compte.
              </p>
            )}
          </div>
        </div>

        <Modal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Lier mon compte AlkherPay" size="sm">
          <form onSubmit={handleLink} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 mb-1">Numéro AlkherPay</p>
                <p className="text-xs text-slate-500">
                  Saisissez le numéro de votre compte AlkherPay.
                </p>
              </div>
            </div>

            <Input
              label="Numéro AlkherPay (8 chiffres)"
              value={linkForm.alkherpay_phone}
              onChange={(e) => setLinkForm({
                alkherpay_phone: e.target.value.replace(/\D/g, '').slice(0, 8),
              })}
              placeholder="66000003"
              maxLength={8}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setLinkModalOpen(false)} disabled={linking}>
                Annuler
              </Button>
              <Button
                type="submit"
                loading={linking}
                disabled={!linkForm.alkherpay_phone || linkForm.alkherpay_phone.length !== 8}
              >
                <CheckCircle2 size={16} /> Lier
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDU NORMAL
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-brand-500" /> Portail AlkherPay
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mon portefeuille personnel AlkherPay
          </p>
        </div>
        <Badge color={pin.hasPin ? 'emerald' : 'amber'}>
          <Lock size={12} /> {pin.hasPin ? 'PIN configuré' : 'PIN non défini'}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                ${isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SOLDE                                       */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'solde' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-center md:justify-start">
            <SoldeCard solde={solde} loading={loadingSolde} onRefresh={loadSolde} />
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Wallet size={16} className="text-brand-500" /> Actions rapides
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTab('transfert')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                    <Send size={18} className="text-brand-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-slate-800">Envoyer un transfert</p>
                    <p className="text-xs text-slate-500">Transférez de l'argent</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500" />
                </button>

                <button
                  onClick={() => setTab('historique')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                    <Receipt size={18} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-slate-800">Voir l'historique</p>
                    <p className="text-xs text-slate-500">Consultez vos transactions</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-brand-500" />
                </button>
              </div>
            </div>

            {solde && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Informations du compte
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Titulaire</span>
                    <span className="font-medium text-slate-800">{solde.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Téléphone</span>
                    <span className="font-mono font-medium text-slate-800">{solde.phone}</span>
                  </div>
                  {solde.province && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Province</span>
                      <span className="font-medium text-slate-800">{solde.province}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Devise</span>
                    <span className="font-medium text-slate-800">XAF (FCFA)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TRANSFERT                                   */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'transfert' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Send size={18} className="text-brand-500" /> Nouveau transfert
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Envoyez de l'argent à un numéro AlkherPay
            </p>

            <form onSubmit={handlePrepareTransfert} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Téléphone destinataire
                </label>
                <input
                  type="tel"
                  value={transfertForm.receiver_phone}
                  onChange={(e) => setTransfertForm({
                    ...transfertForm,
                    receiver_phone: e.target.value.replace(/\D/g, '').slice(0, 8),
                  })}
                  placeholder="66000003"
                  pattern="\d{8}"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Montant
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transfertForm.amount}
                    onChange={(e) => setTransfertForm({ ...transfertForm, amount: e.target.value })}
                    placeholder="1000"
                    min={25}
                    required
                    className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-300 bg-white text-sm font-semibold
                               focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 text-xs">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={transfertForm.description}
                  onChange={(e) => setTransfertForm({ ...transfertForm, description: e.target.value })}
                  placeholder="Ex: Paiement facture"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <Button
                type="submit"
                disabled={
                  !transfertForm.receiver_phone ||
                  transfertForm.receiver_phone.length !== 8 ||
                  !transfertForm.amount ||
                  parseInt(transfertForm.amount, 10) < 25
                }
                className="w-full py-3 text-base"
              >
                <Lock size={18} /> Continuer (PIN requis)
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/30">
              <p className="text-xs uppercase tracking-wider opacity-80">Récapitulatif</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Montant</span>
                  <span className="font-semibold">
                    {transfertForm.amount ? formatCFA(parseInt(transfertForm.amount, 10) || 0) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Frais (2%)</span>
                  <span className="font-semibold">
                    {transfertForm.amount
                      ? formatCFA(Math.floor((parseInt(transfertForm.amount, 10) || 0) * 0.02))
                      : '—'}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">
                    {transfertForm.amount
                      ? formatCFA(
                          (parseInt(transfertForm.amount, 10) || 0) +
                          Math.floor((parseInt(transfertForm.amount, 10) || 0) * 0.02)
                        )
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                🔒 Sécurité
              </p>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li>• Vérifiez bien le numéro du destinataire</li>
                <li>• Les transferts sont instantanés et irréversibles</li>
                <li>• Le PIN est obligatoire</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HISTORIQUE                                  */}
      {/* ═══════════════════════════════════════════ */}
      {tab === 'historique' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchHist}
                onChange={(e) => setSearchHist(e.target.value)}
                placeholder="Rechercher une transaction..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button
              onClick={loadHist}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
              title="Rafraîchir"
            >
              <RefreshCw size={16} className="text-slate-600" />
            </button>
          </div>

          {loadingHist ? (
            <div className="py-16 flex items-center justify-center">
              <Spinner size={32} />
            </div>
          ) : filteredHist.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">
                {searchHist ? 'Aucun résultat' : 'Aucune transaction'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHist.map((t) => (
                <TransactionRow key={t.id || t.reference} transaction={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODALES PIN                                 */}
      {/* ═══════════════════════════════════════════ */}
      <SetPinModal
        open={createPinModalOpen}
        onClose={() => setCreatePinModalOpen(false)}
        onConfirm={handleSetPin}
        loading={pin.loading}
      />

      <PinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handleConfirmTransfert}
        loading={submitting}
        title="Confirmer le transfert"
        message={`Confirmez l'envoi de ${formatCFA(parseInt(transfertForm.amount, 10) || 0)} à ${transfertForm.receiver_phone}`}
        attemptsRemaining={pin.attemptsRemaining}
        blockedUntil={pin.blockedUntil}
      />
    </div>
  );
}
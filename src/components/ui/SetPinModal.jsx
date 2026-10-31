// frontend/src/components/ui/SetPinModal.jsx
import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function SetPinModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPin('');
      setConfirmPin('');
      setError('');
      setShowPin(false);
    }
  }, [open]);

  const weakPins = ['0000', '1111', '1234', '4321', '9999', '2222'];
  const isWeak = weakPins.includes(pin);
  const match = pin && confirmPin && pin === confirmPin;
  const canSubmit = pin.length === 4 && confirmPin.length === 4 && match && !isWeak;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (pin !== confirmPin) setError('Les PIN ne correspondent pas');
      else if (isWeak) setError('PIN trop simple');
      else setError('Veuillez remplir les deux champs');
      return;
    }
    setError('');
    onConfirm(pin, confirmPin);
  };

  return (
    <Modal open={open} onClose={onClose} title="Créer votre code PIN" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
            <Key size={20} className="text-accent-600" />
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-800 mb-1">Première configuration</p>
            <p className="text-xs">
              Choisissez un code PIN à 4 chiffres pour sécuriser vos transactions AlkherPay.
              Vous en aurez besoin pour chaque transfert.
            </p>
          </div>
        </div>

        {/* PIN */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Nouveau PIN</label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              placeholder="••••"
              maxLength={4}
              autoFocus
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 text-center text-2xl font-mono tracking-[0.5em]
                focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
              tabIndex={-1}
            >
              {showPin ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
            </button>
          </div>
          {isWeak && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> Ce PIN est trop simple
            </p>
          )}
        </div>

        {/* Confirmation */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Confirmer le PIN</label>
          <input
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            placeholder="••••"
            maxLength={4}
            className={`w-full px-4 py-3 rounded-xl border text-center text-2xl font-mono tracking-[0.5em]
              ${confirmPin && !match ? 'border-red-400' : 'border-slate-300'}
              focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500`}
          />
          {confirmPin && !match && (
            <p className="text-xs text-red-500 mt-1">Les PIN ne correspondent pas</p>
          )}
        </div>

        {error && (
          <div className="alert-danger text-xs">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="alert-info text-xs">
          <p>
            ⚠️ <strong>Notez ce PIN</strong> en lieu sûr. Il ne peut pas être récupéré.
            En cas d'oubli, contactez un administrateur.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" loading={loading} disabled={!canSubmit}>
            <Key size={16} /> Créer mon PIN
          </Button>
        </div>
      </form>
    </Modal>
  );
}
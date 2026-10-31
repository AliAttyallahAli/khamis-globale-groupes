// frontend/src/components/ui/PinModal.jsx
import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function PinModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Code PIN requis',
  message = 'Saisissez votre code PIN à 4 chiffres pour confirmer',
  attemptsRemaining = null,
  blockedUntil = null,
}) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setShowPin(false);
    }
  }, [open]);

  const isBlocked = blockedUntil && new Date(blockedUntil) > new Date();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Le PIN doit contenir 4 chiffres');
      return;
    }
    setError('');
    onConfirm(pin);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Message */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-brand-600" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Blocage */}
        {isBlocked && (
          <div className="alert-danger text-sm">
            <AlertTriangle size={16} />
            <div>
              <p className="font-medium">PIN bloqué</p>
              <p className="text-xs mt-1">
                Trop de tentatives. Réessayez après{' '}
                <strong>{new Date(blockedUntil).toLocaleTimeString('fr-FR')}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Tentatives restantes */}
        {attemptsRemaining !== null && attemptsRemaining < 5 && !isBlocked && (
          <div className="alert-warning text-sm">
            <AlertTriangle size={16} />
            <p>
              <strong>{attemptsRemaining}</strong> tentative(s) restante(s) avant blocage
            </p>
          </div>
        )}

        {/* Champ PIN */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Code PIN
          </label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(v);
                setError('');
              }}
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={isBlocked}
              className={`w-full px-4 py-3 pr-12 rounded-xl border text-center text-2xl font-mono tracking-[0.5em]
                ${error ? 'border-red-400' : 'border-slate-300'}
                focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                disabled:bg-slate-50 disabled:opacity-50 transition-all`}
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

          {/* Indicateur 4 chiffres */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors
                  ${pin.length > i ? 'bg-brand-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={pin.length !== 4 || isBlocked}
          >
            Confirmer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
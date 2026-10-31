// frontend/src/components/ui/ConfirmModal.jsx
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const VARIANTS = {
  primary: {
    icon: Info,
    color: 'text-brand-500',
    bg: 'bg-brand-50',
    buttonVariant: 'primary',
  },
  danger: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    buttonVariant: 'danger',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    buttonVariant: 'success',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    buttonVariant: 'primary',
  },
};

export default function ConfirmModal({
  open,
  title = 'Confirmation',
  message = 'Êtes-vous sûr ?',
  variant = 'primary',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const config = VARIANTS[variant] || VARIANTS.primary;
  const Icon = config.icon;

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={config.color} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
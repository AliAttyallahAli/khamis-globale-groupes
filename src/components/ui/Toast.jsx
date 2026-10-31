// frontend/src/components/ui/Toast.jsx
// Wrapper autour de react-hot-toast pour usage direct
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ type = 'info', message }) {
  const config = {
    success: { icon: CheckCircle2, color: 'text-emerald-500' },
    error:   { icon: XCircle,      color: 'text-red-500' },
    warning: { icon: AlertTriangle, color: 'text-amber-500' },
    info:    { icon: Info,         color: 'text-brand-500' },
  };

  const { icon: Icon, color } = config[type] || config.info;

  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={color} />
      <span>{message}</span>
    </div>
  );
}

// Helpers pour l'API
Toast.success = (msg) => toast.success(msg);
Toast.error = (msg) => toast.error(msg);
Toast.warning = (msg) => toast(msg, { icon: '⚠️' });
Toast.info = (msg) => toast(msg, { icon: 'ℹ️' });
// frontend/src/components/ui/EmptyState.jsx
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Aucune donnée', message, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-slate-300 mb-4" />
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
    </div>
  );
}
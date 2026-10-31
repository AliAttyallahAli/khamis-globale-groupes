// frontend/src/pages/Notifications.jsx
import { CheckCheck, Trash2, Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { relativeTime } from '../utils/formatters';
import { Badge, EmptyState } from '../components/ui';

const TYPE_COLORS = {
  info: 'blue',
  success: 'emerald',
  warning: 'amber',
  error: 'red',
  transaction: 'violet',
};

export default function Notifications() {
  const { notifications, markRead, markAllRead, remove, refresh } = useNotifications();

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="text-brand-500" /> Notifications
        </h1>
        <div className="flex gap-2">
          <button onClick={refresh}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100">
            Rafraîchir
          </button>
          <button onClick={markAllRead}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium">
            <CheckCheck size={14} /> Tout marquer lu
          </button>
        </div>
      </div>

      {!notifications.length ? (
        <EmptyState title="Aucune notification" message="Vous êtes à jour !" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id}
              className={`flex gap-3 p-4 rounded-xl border transition-colors
                ${n.is_read ? 'bg-white border-slate-200' : 'bg-blue-50/40 border-blue-200'}`}>
              <div className="flex-shrink-0">
                <Badge color={TYPE_COLORS[n.type] || 'slate'}>{n.type || 'info'}</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-800 text-sm">{n.title}</h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{relativeTime(n.created_at)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                {n.link && (
                  <a href={n.link} className="text-xs text-brand-500 hover:underline mt-1 inline-block">
                    Voir détails →
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)}
                    className="p-1 rounded hover:bg-slate-100" title="Marquer lu">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={() => remove(n.id)}
                  className="p-1 rounded hover:bg-red-50 text-red-500" title="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
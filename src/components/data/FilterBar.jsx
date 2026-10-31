// frontend/src/components/data/FilterBar.jsx
import { Search } from 'lucide-react';

export default function FilterBar({ search, onSearchChange, children, onReset }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-wrap items-center gap-2">
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      )}
      {children}
      {onReset && (
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
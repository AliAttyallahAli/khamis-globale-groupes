// frontend/src/components/data/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) {
    return total != null ? (
      <p className="text-xs text-slate-500 mt-3">{total} résultat(s)</p>
    ) : null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-slate-500">
        Page {page} sur {totalPages} — {total} résultat(s)
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 rounded-lg text-sm
                ${p === page ? 'bg-brand-500 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
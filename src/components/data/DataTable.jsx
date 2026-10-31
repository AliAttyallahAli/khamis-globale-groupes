// frontend/src/components/data/DataTable.jsx
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

export default function DataTable({
  columns,
  data = [],
  loading = false,
  emptyTitle = 'Aucune donnée',
  emptyMessage,
  onRowClick,
  rowClassName,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider
                  ${c.align === 'right' ? 'text-right' : ''}
                  ${c.align === 'center' ? 'text-center' : ''}
                  ${c.className || ''}`}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(row) || ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 text-slate-700
                    ${c.align === 'right' ? 'text-right' : ''}
                    ${c.align === 'center' ? 'text-center' : ''}
                    ${c.cellClassName || ''}`}
                >
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
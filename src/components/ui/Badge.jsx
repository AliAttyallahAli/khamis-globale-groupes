// frontend/src/components/ui/Badge.jsx
const COLORS = {
  violet: 'bg-violet-100 text-violet-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function Badge({ color = 'slate', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  ${COLORS[color] || COLORS.slate} ${className}`}
    >
      {children}
    </span>
  );
}
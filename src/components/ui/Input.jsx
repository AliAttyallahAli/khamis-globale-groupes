// frontend/src/components/ui/Input.jsx
export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg border bg-white
                    ${error ? 'border-red-400' : 'border-slate-300'}
                    focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                    ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
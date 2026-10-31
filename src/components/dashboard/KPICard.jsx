// frontend/src/components/dashboard/KPICard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({
  title,
  value,
  icon: Icon,
  color = 'brand',
  subtitle,
  trend,
  trendLabel,
}) {
  const colors = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-500',
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800 truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium mt-2
              ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="text-slate-400">· {trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${colors[color] || colors.brand} text-white flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
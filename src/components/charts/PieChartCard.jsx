// frontend/src/components/charts/PieChartCard.jsx
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const DEFAULT_COLORS = [
  '#1e3a5f', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

export default function PieChartCard({
  title,
  subtitle,
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  height = 300,
  emptyMessage = 'Aucune donnée',
}) {
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}>
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
              style={{ fontSize: '11px' }}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) =>
                new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
              }
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
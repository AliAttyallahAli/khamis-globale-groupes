// frontend/src/components/charts/BarChartCard.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const DEFAULT_COLORS = ['#1e3a5f', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function BarChartCard({
  title,
  subtitle,
  data = [],
  bars = [{ key: 'ca', label: 'CA', color: '#10b981' }],
  xKey = 'name',
  height = 300,
  layout = 'vertical',
  colorful = false,
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
          <BarChart
            data={data}
            layout={layout === 'vertical' ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            {layout === 'vertical' ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v
                  }
                />
                <YAxis
                  type="category"
                  dataKey={xKey}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  width={120}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v
                  }
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value, name) => [
                new Intl.NumberFormat('fr-FR').format(value) + ' FCFA',
                name,
              ]}
            />
            {bars.length > 1 && (
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            )}
            {bars.map((bar, idx) => (
              <Bar key={bar.key} dataKey={bar.key} name={bar.label} radius={[4, 4, 0, 0]}>
                {colorful &&
                  data.map((_, i) => (
                    <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                  ))}
                {!colorful && <Cell fill={bar.color || DEFAULT_COLORS[idx]} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
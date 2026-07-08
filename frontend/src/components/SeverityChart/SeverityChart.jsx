import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = { L1: '#ef4444', L2: '#f59e0b' };
const DEFAULT_COLOR = '#6366f1';

export default function SeverityChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No severity data</p>;
  }

  const chartData = Object.values(data).map((s) => ({
    name: s.severity,
    value: s.total,
    color: COLORS[s.severity] || DEFAULT_COLOR,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <h6 className="text-lg font-semibold mb-2">Severity Distribution</h6>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
            formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
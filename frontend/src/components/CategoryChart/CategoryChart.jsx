import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CategoryChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No category data</p>;
  }

  const chartData = Object.values(data).map((c) => ({
    name: c.categoryTitle?.length > 12 ? c.categoryTitle.slice(0, 12) + '...' : c.categoryTitle || c.categoryId,
    passed: c.passed,
    failed: c.failed,
    compliance: Number(c.compliance.toFixed(1)),
  }));

  return (
    <div>
      <h6 className="text-lg font-semibold mb-2">Compliance by Category</h6>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="passed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function TrendChart({ trend }) {
  if (!trend || !trend.history || trend.history.length < 1) {
    return <p className="text-sm text-slate-400 text-center py-8">Not enough scan history for trend</p>;
  }

  const chartData = trend.history.map((h) => ({
    name: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: h.score,
  }));

  const diff = trend.difference;
  const diffColor = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#94a3b8';
  const diffIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';

  return (
    <div>
      <div className="flex items-baseline gap-4 mb-4">
        <h6 className="text-lg font-semibold">Compliance Trend</h6>
        {trend.previousScore !== null && (
          <p className="text-sm font-semibold" style={{ color: diffColor }}>
            {diffIcon} {Math.abs(diff).toFixed(1)}%
          </p>
        )}
        {trend.previousScore !== null && (
          <span className="text-xs text-slate-400">
            {trend.previousScore}% → {trend.currentScore}%
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
            formatter={(value) => [`${value}%`, 'Compliance']}
          />
          <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#trendGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
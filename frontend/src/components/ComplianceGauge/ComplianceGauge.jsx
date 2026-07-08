export default function ComplianceGauge({ value = 0, size = 180 }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference - (value / 100) * circumference;

  const getColor = (v) => {
    if (v >= 80) return '#22c55e';
    if (v >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center relative">
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          transform="rotate(-90, 80, 80)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <h4 className="text-2xl font-bold" style={{ color }}>{value}%</h4>
        <span className="text-xs text-slate-400">Compliance</span>
      </div>
    </div>
  );
}
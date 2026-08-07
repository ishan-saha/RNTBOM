import { Card, CardContent } from '@mui/material';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: 'Total Rules', value: summary.total || summary.totalRules, key: 'total' },
    { label: 'Passed', value: summary.passed, key: 'passed', color: '#22c55e' },
    { label: 'Failed', value: summary.failed, key: 'failed', color: '#ef4444' },
    { label: 'Warnings', value: summary.warning, key: 'warning', color: '#f59e0b' },
    { label: 'Compliance', value: `${summary.compliancePercentage || 0}%`, key: 'compliancePercentage', color: '#6366f1' },
    { label: 'Failure Rate', value: `${summary.failurePercentage || 0}%`, key: 'failurePercentage', color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.key} className="text-center py-2">
          <CardContent className="py-2 [&:last-child]:pb-2">
            <h3 className="text-3xl font-bold leading-tight" style={{ color: card.color || '#e2e8f0' }}>
              {card.value}
            </h3>
            <span className="text-xs text-slate-400 block mt-1">{card.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
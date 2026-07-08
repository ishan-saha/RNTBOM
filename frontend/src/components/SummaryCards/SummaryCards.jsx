import { Card, CardContent } from '@mui/material';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: 'Total Rules', value: summary.total || summary.totalRules, key: 'total' },
    { label: 'Passed', value: summary.passed, key: 'passed', color: '#22c55e' },
    { label: 'Failed', value: summary.failed, key: 'failed', color: '#ef4444' },
    { label: 'Compliance', value: `${summary.compliancePercentage || 0}%`, key: 'compliancePercentage', color: '#6366f1' },
    { label: 'Manual', value: summary.manual, key: 'manual' },
    { label: 'Skipped', value: summary.skipped, key: 'skipped' },
    { label: 'Not Found', value: summary.notFound, key: 'notFound' },
    { label: 'Automation', value: `${summary.automationPercentage || 0}%`, key: 'automationPercentage' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-4">
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
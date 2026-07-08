import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const SEVERITY_COLORS = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8',
};

export default function RecommendationTable({ recommendations = [] }) {
  if (recommendations.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No recommendations</p>;
  }

  return (
    <TableContainer component={Paper} variant="outlined" className="bg-transparent">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Rule ID</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Expected</TableCell>
            <TableCell>Actual</TableCell>
            <TableCell>Remediation</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recommendations.map((rec) => (
            <TableRow key={rec.ruleId} hover>
              <TableCell className="font-mono font-semibold">{rec.ruleId}</TableCell>
              <TableCell>{rec.title}</TableCell>
              <TableCell>
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: SEVERITY_COLORS[rec.severity?.toLowerCase()] || '#94a3b8' }}
                >
                  {rec.severity}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">{String(rec.expected)}</TableCell>
              <TableCell className="font-mono text-xs">{String(rec.actual)}</TableCell>
              <TableCell className="text-xs text-slate-400 max-w-[250px]">
                {rec.remediation || rec.reason}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
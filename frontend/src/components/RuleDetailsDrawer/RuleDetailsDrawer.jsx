import {
  Drawer, Chip, IconButton, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StatusChip from '../StatusChip/StatusChip';

export default function RuleDetailsDrawer({ rule, open, onClose }) {
  if (!rule) return null;

  const fields = [
    { label: 'Rule ID', value: rule.ruleId },
    { label: 'Title', value: rule.title },
    { label: 'Status', value: <StatusChip status={rule.result} size="small" /> },
    { label: 'Expected', value: rule.expected !== null && rule.expected !== undefined ? String(rule.expected) : '-' },
    { label: 'Actual', value: rule.actual !== null && rule.actual !== undefined ? String(rule.actual) : '-' },
    { label: 'Category', value: rule.categoryTitle || rule.categoryId || '-' },
    { label: 'Severity', value: rule.severity || '-' },
    { label: 'Page', value: rule.pageNumber || '-' },
    { label: 'Confidence', value: rule.confidence !== null && rule.confidence !== undefined ? `${(rule.confidence * 100).toFixed(0)}%` : '-' },
    { label: 'Risk', value: rule.risk || '-' },
    { label: 'Reason', value: rule.reason || '-' },
    { label: 'Recommendation', value: rule.recommendation || rule.remediation || '-' },
    { label: 'Audit', value: rule.audit || '-' },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: 'w-full sm:w-[480px]' }}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h6 className="text-lg font-semibold">Rule Details</h6>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </div>

        <Table size="small">
          <TableBody>
            {fields.map((f) => (
              <TableRow key={f.label}>
                <TableCell
                  className="text-xs text-slate-400 font-semibold w-[140px] align-top"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {f.label}
                </TableCell>
                <TableCell className="text-[13px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {f.value || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Drawer>
  );
}
import {
  Drawer, Chip, IconButton, Divider, Table, TableBody, TableCell, TableRow, TableHead,
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
    { label: 'Reason', value: rule.reason || '-' },
    { label: 'Remediation', value: rule.remediation || '-' },
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

        {rule.conditions && rule.conditions.length > 0 && (
          <>
            <Divider className="my-4" />
            <p className="text-sm font-medium text-slate-400 mb-2">
              Multi-Condition Details ({rule.comparisonOperator || 'AND'})
            </p>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className="text-xs text-slate-400">Key</TableCell>
                  <TableCell className="text-xs text-slate-400">Operator</TableCell>
                  <TableCell className="text-xs text-slate-400">Expected</TableCell>
                  <TableCell className="text-xs text-slate-400">Actual</TableCell>
                  <TableCell className="text-xs text-slate-400">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rule.conditions.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{c.key}</TableCell>
                    <TableCell className="text-xs">{c.operator}</TableCell>
                    <TableCell className="text-xs">{String(c.expected ?? '')}</TableCell>
                    <TableCell className="text-xs">{String(c.actual ?? '')}</TableCell>
                    <TableCell>
                      <Chip label={c.passed ? 'PASS' : 'FAIL'} size="small" color={c.passed ? 'success' : 'error'} variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </Drawer>
  );
}
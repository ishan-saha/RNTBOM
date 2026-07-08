import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, TableSortLabel,
} from '@mui/material';
import StatusChip from '../StatusChip/StatusChip';

export default function RuleTable({ results = [], onRowClick }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('ruleId');
  const [order, setOrder] = useState('asc');

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const sorted = [...results].sort((a, b) => {
    const aVal = a[orderBy] || '';
    const bVal = b[orderBy] || '';
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return order === 'asc' ? cmp : -cmp;
  });

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns = [
    { id: 'ruleId', label: 'Rule ID', width: 100 },
    { id: 'title', label: 'Title', width: 280 },
    { id: 'categoryTitle', label: 'Category', width: 140 },
    { id: 'severity', label: 'Severity', width: 90 },
    { id: 'result', label: 'Status', width: 110 },
    { id: 'expected', label: 'Expected', width: 200 },
    { id: 'actual', label: 'Actual', width: 200 },
  ];

  const SEVERITY_COLORS = {
    L1: '#ef4444', L2: '#f59e0b',
    critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8',
  };

  return (
    <Paper variant="outlined" className="bg-transparent">
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} style={{ width: col.width, minWidth: col.width }}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" className="py-8">
                  <span className="text-slate-400">No matching rules</span>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r, i) => (
                <TableRow
                  key={r._id || i}
                  hover
                  onClick={() => onRowClick?.(r)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  <TableCell className="font-mono font-semibold text-[13px]">{r.ruleId}</TableCell>
                  <TableCell className="text-[13px]">{r.title}</TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {r.categoryTitle || r.categoryId}
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: SEVERITY_COLORS[r.severity] || '#94a3b8' }}
                    >
                      {r.severity}
                    </span>
                  </TableCell>
                  <TableCell><StatusChip status={r.result} /></TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {r.expected !== null && r.expected !== undefined ? String(r.expected) : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">
                    {r.actual !== null && r.actual !== undefined ? String(r.actual) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        className="border-t border-white/6"
        classes={{ selectLabel: 'text-xs', displayedRows: 'text-xs' }}
      />
    </Paper>
  );
}
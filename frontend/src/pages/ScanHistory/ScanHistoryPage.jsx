import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchBar from '../../components/SearchBar/SearchBar';
import StatusChip from '../../components/StatusChip/StatusChip';
import { useScans } from '../../hooks/useScans';
import EmptyState, { LoadingState } from '../../components/EmptyState/EmptyState';

function ComplianceScore({ value }) {
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <h6 className="text-lg font-bold" style={{ color }}>{value}%</h6>
  );
}

export default function ScanHistoryPage() {
  const navigate = useNavigate();
  const { data: scans = [], isLoading } = useScans();
  const [search, setSearch] = useState('');

  const filtered = scans.filter((s) => {
    if (!search) return true;
    const bmName = s.benchmarkId?.name || '';
    return bmName.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) return <LoadingState message="Loading scan history..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-2xl font-bold">Scan History</h4>
          <p className="text-sm text-slate-400">
            {scans.length} scan{scans.length !== 1 ? 's' : ''} completed
          </p>
        </div>
        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => navigate('/compliance/scan/run')}>
          New Scan
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by benchmark name..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={scans.length === 0 ? 'No scans yet' : 'No matching scans'}
          description={scans.length === 0 ? 'Run your first compliance scan to see results here.' : 'Try a different search term.'}
          action={
            scans.length === 0 ? (
              <Button variant="contained" onClick={() => navigate('/compliance/scan/run')}>
                Run First Scan
              </Button>
            ) : null
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined" className="bg-transparent">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Benchmark</TableCell>
                <TableCell>Compliance</TableCell>
                <TableCell>Passed</TableCell>
                <TableCell>Failed</TableCell>
                <TableCell>Manual</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell className="text-[13px]">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    }) : '-'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {s.benchmarkId?.name || 'Unknown'}
                    <span className="text-xs text-slate-400 block">
                      {s.benchmarkId?.version || ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ComplianceScore value={s.summary?.compliancePercentage || 0} />
                  </TableCell>
                  <TableCell><Chip label={s.summary?.passed || 0} size="small" color="success" variant="outlined" /></TableCell>
                  <TableCell><Chip label={s.summary?.failed || 0} size="small" color="error" variant="outlined" /></TableCell>
                  <TableCell><Chip label={s.summary?.manual || 0} size="small" color="warning" variant="outlined" /></TableCell>
                  <TableCell><StatusChip status={s.status === 'completed' ? 'pass' : s.status === 'running' ? 'skipped' : 'not_found'} /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/compliance/scans/${s._id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View report">
                      <IconButton size="small" onClick={() => navigate(`/compliance/reports/${s._id}`)}>
                        <ArticleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
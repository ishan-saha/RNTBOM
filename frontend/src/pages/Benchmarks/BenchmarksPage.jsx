import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useBenchmarks, useDeleteBenchmark } from '../../hooks/useBenchmarks';
import EmptyState, { LoadingState } from '../../components/EmptyState/EmptyState';

export default function BenchmarksPage() {
  const navigate = useNavigate();
  const { data: benchmarks = [], isLoading, error } = useBenchmarks();
  const deleteMutation = useDeleteBenchmark();
  const [search, setSearch] = useState('');

  const filtered = benchmarks.filter((b) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.version?.includes(search)
  );

  if (isLoading) return <LoadingState message="Loading benchmarks..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-2xl font-bold">Benchmarks</h4>
          <p className="text-sm text-slate-400">
            {benchmarks.length} benchmark{benchmarks.length !== 1 ? 's' : ''} imported
          </p>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/compliance/benchmarks/import')}>
          Import Benchmark
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search benchmarks..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={benchmarks.length === 0 ? 'No benchmarks imported' : 'No matching benchmarks'}
          description={benchmarks.length === 0 ? 'Import a CIS benchmark PDF to get started.' : 'Try a different search term.'}
          action={
            benchmarks.length === 0 ? (
              <Button variant="contained" onClick={() => navigate('/compliance/benchmarks/import')}>
                Import Benchmark
              </Button>
            ) : null
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined" className="bg-transparent">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Import Date</TableCell>
                <TableCell>Rules</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b._id} hover>
                  <TableCell className="font-semibold">{b.name}</TableCell>
                  <TableCell><Chip label={b.version} size="small" variant="outlined" /></TableCell>
                  <TableCell className="text-slate-400 text-[13px]">{b.category || '-'}</TableCell>
                  <TableCell className="text-[13px]">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      <Chip label={b.ruleCount ?? '?'} size="small" color="primary" variant="outlined" />
                      {b.automatedCount > 0 && (
                        <Chip label={`${b.automatedCount}A`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                      )}
                      {b.manualCount > 0 && (
                        <Chip label={`${b.manualCount}M`} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(b._id)}>
                        <DeleteIcon fontSize="small" />
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

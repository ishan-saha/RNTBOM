import { useState } from 'react';
import { Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useScans } from '../../hooks/useScans';
import { useBenchmarks } from '../../hooks/useBenchmarks';
import ComplianceGauge from '../../components/ComplianceGauge/ComplianceGauge';
import TrendChart from '../../components/TrendChart/TrendChart';
import SummaryCards from '../../components/SummaryCards/SummaryCards';
import RecommendationTable from '../../components/RecommendationTable/RecommendationTable';
import EmptyState, { LoadingState } from '../../components/EmptyState/EmptyState';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: scans = [], isLoading: scansLoading } = useScans();
  const { data: benchmarks = [], isLoading: bmLoading } = useBenchmarks();

  if (scansLoading || bmLoading) return <LoadingState message="Loading dashboard..." />;

  const latestScan = scans.length > 0 ? scans[0] : null;

  const completedScans = scans.filter((s) => s.status === 'completed');
  const avgCompliance = completedScans.length > 0
    ? Number((completedScans.reduce((s, c) => s + (c.summary?.compliancePercentage || 0), 0) / completedScans.length).toFixed(1))
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-2xl font-bold">Compliance Dashboard</h4>
        <div className="flex gap-3">
          <Button variant="outlined" onClick={() => navigate('/compliance/benchmarks')}>
            Benchmarks
          </Button>
          <Button variant="contained" onClick={() => navigate('/compliance/scan/run')}>
            Run Scan
          </Button>
        </div>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card className="text-center py-4">
            <CardContent>
              <h3 className="text-3xl font-bold text-indigo-500">{benchmarks.length}</h3>
              <span className="text-xs text-slate-400">Total Benchmarks</span>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card className="text-center py-4">
            <CardContent>
              <h3 className="text-3xl font-bold text-green-500">{scans.length}</h3>
              <span className="text-xs text-slate-400">Total Scans</span>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card className="text-center py-4">
            <CardContent>
              <h3 className="text-3xl font-bold text-amber-500">{avgCompliance}%</h3>
              <span className="text-xs text-slate-400">Avg Compliance</span>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card className="text-center py-4">
            <CardContent>
              <ComplianceGauge value={avgCompliance} size={100} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} className="mt-2">
        {latestScan && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <h6 className="text-lg font-semibold mb-2">Latest Scan</h6>
                <SummaryCards summary={latestScan.summary} />
                <div className="mt-4 flex gap-2">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/compliance/scans/${latestScan._id}`)}>
                    View Details
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/compliance/reports/${latestScan._id}`)}>
                    View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: latestScan ? 6 : 12 }}>
          <Card>
            <CardContent>
              <TrendChart trend={(completedScans.length > 0) ? {
                history: completedScans.map((s) => ({
                  date: s.createdAt,
                  score: s.summary?.compliancePercentage || 0,
                })),
                previousScore: completedScans.length > 1 ? completedScans[completedScans.length - 1]?.summary?.compliancePercentage : null,
                currentScore: completedScans[0]?.summary?.compliancePercentage || 0,
                difference: completedScans.length > 1
                  ? Number(((completedScans[0]?.summary?.compliancePercentage || 0) - (completedScans[1]?.summary?.compliancePercentage || 0)).toFixed(2))
                  : null,
              } : null} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {scans.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No compliance scans yet"
            description="Import a benchmark, upload a configuration, and run your first scan to see results here."
            action={
              <Button variant="contained" onClick={() => navigate('/compliance/scan/run')}>
                Run Your First Scan
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Card, CardContent, Grid, Tabs, Tab, Chip, Table, TableBody, TableCell,
  TableRow, TableHead,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useReport } from '../../hooks/useReports';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import ComplianceGauge from '../../components/ComplianceGauge/ComplianceGauge';
import CategoryChart from '../../components/CategoryChart/CategoryChart';
import SeverityChart from '../../components/SeverityChart/SeverityChart';
import TrendChart from '../../components/TrendChart/TrendChart';
import RecommendationTable from '../../components/RecommendationTable/RecommendationTable';
import { LoadingState } from '../../components/EmptyState/EmptyState';

export default function ReportsPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useReport(scanId);
  const [tab, setTab] = useState(0);

  if (isLoading) return <LoadingState message="Generating report..." />;
  if (error) return <p className="text-red-500">Failed to load report: {error.message}</p>;
  if (!report) return <p className="text-slate-400">Report not available</p>;

  const { summary, categories, severity, recommendations, manualChecks, missingConfigurations, trend, metadata } = report;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/compliance/scans/${scanId}`)} variant="text" />
          <div>
            <h4 className="text-2xl font-bold">Compliance Report</h4>
            <p className="text-sm text-slate-400">
              {metadata?.benchmarkName || 'Benchmark'} — {new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <ExportMenu scanId={scanId} />
      </div>

      <Grid container spacing={3} className="mb-6">
        <Grid size={{ xs: 12, md: 3 }}>
          <Card className="text-center py-4">
            <CardContent>
              <ComplianceGauge value={summary?.compliancePercentage || 0} size={140} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Rules', value: summary?.totalRules || summary?.total, color: '#e2e8f0' },
                  { label: 'Passed', value: summary?.passed, color: '#22c55e' },
                  { label: 'Failed', value: summary?.failed, color: '#ef4444' },
                  { label: 'Not Found', value: summary?.notFound, color: '#3b82f6' },
                  { label: 'Manual', value: summary?.manual, color: '#f59e0b' },
                  { label: 'Skipped', value: summary?.skipped, color: '#94a3b8' },
                  { label: 'Automation', value: `${summary?.automationPercentage || 0}%`, color: '#6366f1' },
                  { label: 'Failure Rate', value: `${summary?.failurePercentage || 0}%`, color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <h4 className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value ?? 0}
                    </h4>
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-4">
            <Tab label="Categories" />
            <Tab label="Severity" />
            <Tab label="Recommendations" />
            <Tab label="Manual Checks" />
            <Tab label="Missing Configs" />
            <Tab label="Trend" />
            <Tab label="Metadata" />
          </Tabs>

          {tab === 0 && (
            <div className="grid grid-cols-2 gap-6">
              <CategoryChart data={categories} />
              <div>
                <h6 className="text-lg font-semibold mb-2">All Categories</h6>
                {categories && Object.values(categories).map((c) => (
                  <div key={c.categoryId} className="flex justify-between items-center py-1.5">
                    <p className="text-sm">{c.categoryTitle}</p>
                    <div className="flex gap-2 items-center">
                      <Chip label={`${c.passed}/${c.failed}`} size="small" variant="outlined" color={c.failed > 0 ? 'error' : 'success'} />
                      <p className="text-sm font-semibold min-w-[48px] text-right">{c.compliance}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="grid grid-cols-2 gap-6">
              <SeverityChart data={severity} />
              <div>
                <h6 className="text-lg font-semibold mb-2">All Levels</h6>
                {severity && Object.values(severity).map((s) => (
                  <div key={s.severity} className="flex justify-between items-center py-1.5">
                    <p className="text-sm">{s.severity}</p>
                    <div className="flex gap-2 items-center">
                      <Chip label={`${s.passed}/${s.failed}`} size="small" variant="outlined" color={s.failed > 0 ? 'error' : 'success'} />
                      <p className="text-sm font-semibold min-w-[48px] text-right">{s.compliance}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 2 && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Failed Rules ({recommendations?.length || 0})
              </h6>
              <RecommendationTable recommendations={recommendations || []} />
            </div>
          )}

          {tab === 3 && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Manual Checks ({manualChecks?.length || 0})
              </h6>
              {manualChecks?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Audit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualChecks.map((mc) => (
                      <TableRow key={mc.ruleId}>
                        <TableCell className="font-mono font-semibold">{mc.ruleId}</TableCell>
                        <TableCell>{mc.title}</TableCell>
                        <TableCell><Chip label={mc.severity} size="small" variant="outlined" /></TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-[300px]">{mc.audit || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-slate-400 py-8 text-center">No manual checks</p>
              )}
            </div>
          )}

          {tab === 4 && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Missing Configurations ({missingConfigurations?.length || 0})
              </h6>
              {missingConfigurations?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Config Key</TableCell>
                      <TableCell>Expected</TableCell>
                      <TableCell>Remediation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missingConfigurations.map((mc) => (
                      <TableRow key={mc.ruleId}>
                        <TableCell className="font-mono font-semibold">{mc.ruleId}</TableCell>
                        <TableCell>{mc.title}</TableCell>
                        <TableCell className="font-mono text-xs">{mc.key || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{String(mc.expected ?? '')}</TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-[250px]">{mc.remediation || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-slate-400 py-8 text-center">All configurations present</p>
              )}
            </div>
          )}

          {tab === 5 && (
            <TrendChart trend={trend} />
          )}

          {tab === 6 && (
            <div>
              <h6 className="text-lg font-semibold mb-2">Report Metadata</h6>
              <Table size="small">
                <TableBody>
                  {[
                    ['Scan ID', metadata?.scanId],
                    ['Benchmark', metadata?.benchmarkName || `${metadata?.benchmarkId}`],
                    ['Version', metadata?.benchmarkVersion],
                    ['Status', metadata?.status],
                    ['Scanned At', new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleString()],
                    ['Total Results', metadata?.totalResults],
                    ['Configuration ID', metadata?.parsedConfigurationId],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="text-slate-400 font-semibold w-[200px]">{label}</TableCell>
                      <TableCell className="font-mono text-xs">{value || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Card, CardContent, Grid, Tabs, Tab, Chip, Table, TableBody, TableCell,
  TableRow, TableHead,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
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

  const {
    summary, categories, severity, recommendations, warningItems,
    trend, metadata,
    executiveSummary, riskAnalysis, aiRecommendations, aiEnhanced,
  } = report;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/compliance/scans/${scanId}`)} variant="text" />
          <div>
            <h4 className="text-2xl font-bold">Compliance Report</h4>
            <p className="text-sm text-slate-400">
              {metadata?.benchmarkName || 'Benchmark'} — {new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleDateString()}
              {aiEnhanced && <Chip icon={<PsychologyIcon />} label="AI Enhanced" size="small" color="info" variant="outlined" className="ml-2" />}
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
                  { label: 'Warnings', value: summary?.warning, color: '#f59e0b' },
                  { label: 'Warning Rate', value: `${summary?.warningPercentage || 0}%`, color: '#f59e0b' },
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
            {executiveSummary && <Tab label="Executive Summary" />}
            <Tab label="Categories" />
            <Tab label="Severity" />
            <Tab label="Recommendations" />
            <Tab label="Warnings" />
            <Tab label="Trend" />
            <Tab label="Metadata" />
          </Tabs>

          {tab === 0 && executiveSummary && (
            <div>
              <h6 className="text-lg font-semibold mb-2">Executive Summary</h6>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {executiveSummary}
              </div>

              {riskAnalysis && (
                <div className="mt-6">
                  <h6 className="text-lg font-semibold mb-2">
                    Risk Analysis
                    <Chip
                      label={riskAnalysis.overallRiskLevel?.toUpperCase() || 'UNKNOWN'}
                      size="small"
                      color={
                        riskAnalysis.overallRiskLevel === 'critical' ? 'error' :
                        riskAnalysis.overallRiskLevel === 'high' ? 'warning' :
                        riskAnalysis.overallRiskLevel === 'medium' ? 'info' : 'success'
                      }
                      className="ml-2"
                    />
                  </h6>
                  {riskAnalysis.topRisks?.length > 0 && (
                    <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4 mb-4">
                      {riskAnalysis.topRisks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  )}
                  {riskAnalysis.complianceImplications && (
                    <p className="text-sm text-slate-400 mt-2">{riskAnalysis.complianceImplications}</p>
                  )}
                </div>
              )}

              {aiRecommendations?.quickWins?.length > 0 && (
                <div className="mt-6">
                  <h6 className="text-lg font-semibold mb-2">Quick Wins</h6>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rule ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiRecommendations.quickWins.map((qw) => (
                        <TableRow key={qw.ruleId}>
                          <TableCell className="font-mono font-semibold">{qw.ruleId}</TableCell>
                          <TableCell>{qw.title}</TableCell>
                          <TableCell className="text-xs">{qw.action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {executiveSummary && (
                <div className="mt-4 text-xs text-slate-500 italic">
                  Powered by AI via Llama 3.3 70B
                </div>
              )}
            </div>
          )}

          {tab === (executiveSummary ? 1 : 0) && (
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

          {tab === (executiveSummary ? 2 : 1) && (
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

          {tab === (executiveSummary ? 3 : 2) && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Failed Rules ({recommendations?.length || 0})
              </h6>
              <RecommendationTable recommendations={recommendations || []} />
            </div>
          )}

          {tab === (executiveSummary ? 4 : 3) && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Warnings ({warningItems?.length || 0})
              </h6>
              {warningItems?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Expected</TableCell>
                      <TableCell>Actual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warningItems.map((w) => (
                      <TableRow key={w.ruleId}>
                        <TableCell className="font-mono font-semibold">{w.ruleId}</TableCell>
                        <TableCell>{w.title}</TableCell>
                        <TableCell><Chip label={w.severity} size="small" variant="outlined" /></TableCell>
                        <TableCell className="text-xs max-w-[200px]">{w.reason}</TableCell>
                        <TableCell className="font-mono text-xs">{String(w.expected ?? '')}</TableCell>
                        <TableCell className="font-mono text-xs">{String(w.actual ?? '')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-slate-400 py-8 text-center">No warnings</p>
              )}
            </div>
          )}

          {tab === (executiveSummary ? 5 : 4) && (
            <TrendChart trend={trend} />
          )}

          {tab === (executiveSummary ? 6 : 5) && (
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
                    ['AI Enhanced', aiEnhanced ? 'Yes' : 'No'],
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

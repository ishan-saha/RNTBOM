import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Grid, Tabs, Tab, Card, CardContent, Chip, Table, TableBody, TableCell,
  TableRow, TableHead,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import { useScan } from '../../hooks/useScans';
import ComplianceGauge from '../../components/ComplianceGauge/ComplianceGauge';
import SummaryCards from '../../components/SummaryCards/SummaryCards';
import CategoryChart from '../../components/CategoryChart/CategoryChart';
import SeverityChart from '../../components/SeverityChart/SeverityChart';
import RuleTable from '../../components/RuleTable/RuleTable';
import RuleDetailsDrawer from '../../components/RuleDetailsDrawer/RuleDetailsDrawer';
import RecommendationTable from '../../components/RecommendationTable/RecommendationTable';
import { LoadingState } from '../../components/EmptyState/EmptyState';

export default function ScanDetailsPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useScan(scanId);
  const [tab, setTab] = useState(0);
  const [selectedRule, setSelectedRule] = useState(null);

  if (isLoading) return <LoadingState message="Loading scan details..." />;
  if (!data) return <p className="text-red-500">Scan not found</p>;

  const { scan, results } = data;
  const summary = scan.summary || {};

  const { categoryData, severityData, failedResults, warningResults } = useMemo(() => {
    const cat = {};
    const sev = {};
    const failed = [];
    const warnings = [];

    if (results) {
      for (const r of results) {
        const catId = r.categoryId || 'uncategorized';
        if (!cat[catId]) {
          cat[catId] = { categoryId: catId, categoryTitle: r.categoryTitle || catId, total: 0, passed: 0, failed: 0, warning: 0, compliance: 0 };
        }
        cat[catId].total++;
        if (r.result === 'pass') cat[catId].passed++;
        else if (r.result === 'fail') cat[catId].failed++;
        else if (r.result === 'warning') cat[catId].warning++;

        const sevKey = r.severity || 'unspecified';
        if (!sev[sevKey]) {
          sev[sevKey] = { severity: sevKey, total: 0, passed: 0, failed: 0, warning: 0, compliance: 0 };
        }
        sev[sevKey].total++;
        if (r.result === 'pass') sev[sevKey].passed++;

        if (r.result === 'fail') failed.push(r);
        if (r.result === 'warning') warnings.push(r);
      }

      for (const c of Object.values(cat)) {
        const e = c.passed + c.failed;
        c.compliance = e > 0 ? Number(((c.passed / e) * 100).toFixed(2)) : 0;
      }
      for (const s of Object.values(sev)) {
        const e = s.passed + s.failed;
        s.compliance = e > 0 ? Number(((s.passed / e) * 100).toFixed(2)) : 0;
      }
    }

    return { categoryData: cat, severityData: sev, failedResults: failed, warningResults: warnings };
  }, [results]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/compliance/scans')} variant="text" />
          <div>
            <h4 className="text-2xl font-bold">Scan Details</h4>
            <p className="text-sm text-slate-400">
              {new Date(scan.createdAt).toLocaleString()} — {results?.length || 0} rules
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportMenu scanId={scanId} />
          <Button
            variant="outlined"
            startIcon={<ArticleIcon />}
            onClick={() => navigate(`/compliance/reports/${scanId}`)}
          >
            View Report
          </Button>
        </div>
      </div>

      <Grid container spacing={3} className="mb-6">
        <Grid size={{ xs: 12, md: 8 }}>
          <SummaryCards summary={{ ...summary, totalRules: results?.length || 0 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <div className="flex justify-center">
            <ComplianceGauge value={summary.compliancePercentage || 0} />
          </div>
        </Grid>
      </Grid>

      <Card className="mb-6">
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-4">
            <Tab label="Rule Results" />
            <Tab label="Category Analysis" />
            <Tab label="Severity Analysis" />
            <Tab label="Failed Rules" />
            <Tab label="Warnings" />
          </Tabs>

          {tab === 0 && (
            <RuleTable results={results || []} onRowClick={(r) => setSelectedRule(r)} />
          )}
          {tab === 1 && (
            <div className="grid grid-cols-2 gap-6">
              <CategoryChart data={categoryData} />
              <div>
                <h6 className="text-lg font-semibold mb-2">Category Summary</h6>
                {Object.values(categoryData).map((c) => (
                  <div key={c.categoryId} className="flex justify-between py-1">
                    <p className="text-sm">{c.categoryTitle}</p>
                    <p className="text-sm font-semibold">{c.compliance}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 2 && (
            <div className="grid grid-cols-2 gap-6">
              <SeverityChart data={severityData} />
              <div>
                <h6 className="text-lg font-semibold mb-2">Severity Summary</h6>
                {Object.values(severityData).map((s) => (
                  <div key={s.severity} className="flex justify-between py-1">
                    <p className="text-sm">{s.severity}</p>
                    <p className="text-sm font-semibold">{s.failed} failed / {s.total} total</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 3 && (
            <RecommendationTable recommendations={failedResults} />
          )}
          {tab === 4 && (
            <div>
              <h6 className="text-lg font-semibold mb-2">
                Warnings ({warningResults.length})
              </h6>
              {warningResults.length > 0 ? (
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
                    {warningResults.map((r) => (
                      <TableRow key={r.ruleId} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedRule(r)}>
                        <TableCell className="font-mono font-semibold">{r.ruleId}</TableCell>
                        <TableCell>{r.title}</TableCell>
                        <TableCell><Chip label={r.severity} size="small" variant="outlined" /></TableCell>
                        <TableCell className="text-xs max-w-[200px]">{r.reason}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.expected ?? '')}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.actual ?? '')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-slate-400 py-8 text-center">No warnings</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RuleDetailsDrawer
        rule={selectedRule}
        open={!!selectedRule}
        onClose={() => setSelectedRule(null)}
      />
    </div>
  );
}

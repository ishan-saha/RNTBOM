import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel, Alert, CircularProgress,
} from '@mui/material';
import { useBenchmarks } from '../../hooks/useBenchmarks';
import { useRunScan } from '../../hooks/useScans';
import { getParsedConfigurations } from '../../services/configurationApi';

export default function RunScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: benchmarks = [] } = useBenchmarks();
  const { data: configsData } = useQuery({
    queryKey: ['parsedConfigurations'],
    queryFn: async () => {
      const res = await getParsedConfigurations();
      return res.data.data?.configurations || [];
    },
  });
  const configs = configsData || [];
  const runScanMutation = useRunScan();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedBenchmark, setSelectedBenchmark] = useState('');
  const [parsedConfigId, setParsedConfigId] = useState(location.state?.parsedConfigurationId || '');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const steps = ['Select Benchmark', 'Select Configuration', 'Run Scan', 'Review Results'];

  const filteredConfigs = selectedBenchmark
    ? configs.filter((c) => c.benchmarkId === selectedBenchmark)
    : configs;

  const handleRunScan = async () => {
    if (!selectedBenchmark || !parsedConfigId) return;
    setRunning(true);
    setError('');

    try {
      const res = await runScanMutation.mutateAsync({
        benchmarkId: selectedBenchmark,
        parsedConfigurationId: parsedConfigId,
      });
      setScanResult(res.data);
      setActiveStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (parsedConfigId && selectedBenchmark) setActiveStep(2);
    else if (parsedConfigId || selectedBenchmark) setActiveStep(1);
  }, [parsedConfigId, selectedBenchmark]);

  return (
    <div>
      <h4 className="text-2xl font-bold mb-6">Run Compliance Scan</h4>

      <Stepper activeStep={activeStep} className="mb-8">
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Card className="max-w-[600px] mx-auto">
        <CardContent className="p-8">
          {activeStep <= 2 && (
            <div className="flex flex-col gap-6">
              <FormControl fullWidth>
                <InputLabel>Benchmark</InputLabel>
                <Select
                  value={selectedBenchmark}
                  label="Benchmark"
                  onChange={(e) => setSelectedBenchmark(e.target.value)}
                >
                  {benchmarks.map((b) => (
                    <MenuItem key={b._id} value={b._id}>{b.name} v{b.version}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Parsed Configuration</InputLabel>
                <Select
                  value={parsedConfigId}
                  label="Parsed Configuration"
                  onChange={(e) => setParsedConfigId(e.target.value)}
                >
                  {filteredConfigs.length === 0 ? (
                    <MenuItem disabled value="">
                      {!selectedBenchmark
                        ? 'Select a benchmark first'
                        : 'No configurations for this benchmark — upload one'}
                    </MenuItem>
                  ) : (
                    filteredConfigs.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.fileName} — {c.benchmarkName} v{c.benchmarkVersion} ({c.keyCount} keys)
                      </MenuItem>
                    ))
                  )}
                </Select>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a configuration first at{' '}
                  <span className="text-indigo-500 cursor-pointer" onClick={() => navigate('/compliance/configurations/upload')}>
                    Configuration Upload
                  </span>
                </p>
              </FormControl>
            </div>
          )}

          {activeStep === 3 && scanResult && (
            <div className="text-center">
              <CircularProgress
                variant="determinate"
                value={scanResult.summary?.compliancePercentage || 0}
                size={80}
                style={{ color: '#22c55e', marginBottom: 16 }}
              />
              <h5 className="text-xl font-semibold mb-2">
                Scan Complete — {scanResult.summary?.compliancePercentage}% Compliance
              </h5>
              <p className="text-sm text-slate-400 mb-4">
                {scanResult.summary?.passed} passed, {scanResult.summary?.failed} failed,{' '}
                {scanResult.summary?.warning} warnings
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="contained"
                  onClick={() => navigate(`/compliance/scans/${scanResult.scanId}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/compliance/reports/${scanResult.scanId}`)}
                >
                  View Report
                </Button>
                <Button variant="text" onClick={() => { setActiveStep(0); setScanResult(null); }}>
                  Run Another
                </Button>
              </div>
            </div>
          )}

          {error && <Alert severity="error" className="mt-4">{error}</Alert>}

          {activeStep < 3 && (
            <div className="flex gap-4 mt-6">
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!selectedBenchmark || !parsedConfigId || running}
                onClick={handleRunScan}
              >
                {running ? 'Running Scan...' : 'Run Scan'}
              </Button>
              <Button variant="outlined" size="large" fullWidth onClick={() => navigate('/compliance/scans')}>
                View History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
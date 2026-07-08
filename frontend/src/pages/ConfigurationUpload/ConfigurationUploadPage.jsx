import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, CardContent, LinearProgress, Alert, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import API from '../../services/api';
import { useBenchmarks } from '../../hooks/useBenchmarks';

export default function ConfigurationUploadPage() {
  const navigate = useNavigate();
  const { data: benchmarks = [] } = useBenchmarks();
  const [files, setFiles] = useState([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState('');
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback((e) => {
    setFiles(Array.from(e.target.files));
    setParsed(null);
    setProgress(0);
    setError('');
  }, []);

  const handleUpload = async () => {
    if (files.length === 0 || !selectedBenchmark) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('benchmarkId', selectedBenchmark);

    try {
      const res = await API.post('/configurations/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setParsed(res.data.data || res.data);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const config = parsed?.parsedConfiguration || parsed?.configuration || parsed;
  const configId = parsed?.parsedConfiguration?._id || parsed?._id || parsed?.id;
  const keyCount = config?.normalizedConfiguration
    ? Object.keys(config.normalizedConfiguration).length
    : config?.keys?.length || 0;

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-2xl font-bold">Upload Configuration</h4>
        <p className="text-sm text-slate-400">
          Upload configuration files to compare against benchmark rules
        </p>
      </div>

      <Card className="max-w-[700px] mx-auto">
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-white/12 rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 hover:border-[#6366f1]"
            style={{ background: files.length > 0 ? 'rgba(99,102,241,0.04)' : 'transparent' }}
            onClick={() => document.getElementById('config-upload').click()}
          >
            <input
              id="config-upload"
              type="file"
              multiple
              accept=".json,.yaml,.yml,.xml,.ini,.properties,.reg,.plist,.conf,.txt"
              hidden
              onChange={handleFiles}
            />
            <CloudUploadIcon style={{ fontSize: 48, color: files.length > 0 ? '#6366f1' : '#94a3b8', marginBottom: 16 }} />
            {files.length > 0 ? (
              <>
                <h6 className="text-lg font-semibold text-indigo-500">{files.length} file(s) selected</h6>
                <div className="mt-2 flex gap-1 flex-wrap justify-center">
                  {files.map((f, i) => <Chip key={i} label={f.name} size="small" variant="outlined" />)}
                </div>
              </>
            ) : (
              <>
                <h6 className="text-lg font-semibold text-slate-400">Drop config files here or click to browse</h6>
                <span className="text-xs text-slate-400">
                  JSON, YAML, XML, INI, Properties, REG, Plist, Conf
                </span>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <FormControl fullWidth size="small">
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
              <div className="flex justify-between mb-2">
                <p className="text-sm text-slate-400">Upload Progress</p>
                <p className="text-sm font-semibold">{progress}%</p>
              </div>
              <LinearProgress variant="determinate" value={progress} className="h-1.5 rounded-full" />
            </div>
          )}

          {parsed && (
            <Alert icon={<CheckCircleIcon />} severity="success" className="mt-6">
              <p className="text-sm font-medium">Configuration parsed successfully</p>
              <p className="text-sm">{keyCount} configuration keys extracted</p>
            </Alert>
          )}

          {parsed && configId && (
            <Alert severity="info" className="mt-4">
              <p className="text-sm">
                Configuration ID: <code style={{ color: '#6366f1' }}>{configId}</code>
              </p>
            </Alert>
          )}

          {error && (
            <Alert severity="error" className="mt-4">
              {error}
            </Alert>
          )}

          <div className="flex gap-4 mt-6">
            <Button
              variant="contained"
              disabled={files.length === 0 || !selectedBenchmark || uploading}
              onClick={handleUpload}
              fullWidth
              size="large"
            >
              {uploading ? 'Parsing...' : 'Parse Configuration'}
            </Button>
            {parsed && configId && (
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                onClick={() => navigate('/compliance/scan/run', { state: { parsedConfigurationId: configId } })}
              >
                Continue to Scan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
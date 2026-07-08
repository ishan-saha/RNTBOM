import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, CardContent, LinearProgress, Alert, Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useImportBenchmark } from '../../hooks/useBenchmarks';

export default function BenchmarkImportPage() {
  const navigate = useNavigate();
  const importMutation = useImportBenchmark();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(null);

  const handleFile = useCallback((e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setImported(null);
      setProgress(0);
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const result = await importMutation.mutateAsync({
        formData,
        onProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setImported(result.data?.benchmark || result.data || result);
      setProgress(100);
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-2xl font-bold">Import Benchmark</h4>
        <p className="text-sm text-slate-400">
          Upload a CIS Benchmark PDF to extract rules for compliance scanning
        </p>
      </div>

      <Card className="max-w-[700px] mx-auto">
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-white/12 rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 hover:border-[#6366f1]"
            style={{ background: file ? 'rgba(99,102,241,0.04)' : 'transparent' }}
            onClick={() => document.getElementById('pdf-upload').click()}
          >
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              hidden
              onChange={handleFile}
            />
            <CloudUploadIcon style={{ fontSize: 48, color: file ? '#6366f1' : '#94a3b8', marginBottom: 16 }} />
            {file ? (
              <>
                <h6 className="text-lg font-semibold text-indigo-500">{file.name}</h6>
                <span className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </>
            ) : (
              <>
                <h6 className="text-lg font-semibold text-slate-400">Drop PDF here or click to browse</h6>
                <span className="text-xs text-slate-400">CIS Benchmark PDF files only</span>
              </>
            )}
          </div>

          {file && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <p className="text-sm text-slate-400">Upload Progress</p>
                <p className="text-sm font-semibold">{progress}%</p>
              </div>
              <LinearProgress variant="determinate" value={progress} className="h-1.5 rounded-full" />
            </div>
          )}

          {imported && (
            <Alert icon={<CheckCircleIcon />} severity="success" className="mt-6">
              <p className="text-sm font-medium">
                Imported: {imported.name} v{imported.version}
              </p>
              <p className="text-sm">
                {imported.totalRules || imported.ruleCount || 0} rules extracted
              </p>
            </Alert>
          )}

          <div className="flex gap-4 mt-6">
            <Button
              variant="contained"
              disabled={!file || importMutation.isPending}
              onClick={handleImport}
              fullWidth
              size="large"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Benchmark'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/compliance/benchmarks')} fullWidth size="large">
              Cancel
            </Button>
          </div>

          {importMutation.isError && (
            <Alert severity="error" className="mt-4">
              {importMutation.error?.response?.data?.message || importMutation.error.message}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
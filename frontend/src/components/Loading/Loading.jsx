import { CircularProgress } from '@mui/material';

export default function Loading({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <CircularProgress size={40} style={{ color: '#6366f1' }} className="mb-4" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
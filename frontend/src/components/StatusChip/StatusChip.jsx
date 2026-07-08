import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  pass: { label: 'Pass', color: 'success' },
  fail: { label: 'Fail', color: 'error' },
  manual: { label: 'Manual', color: 'warning' },
  skipped: { label: 'Skipped', color: 'default' },
  not_found: { label: 'Not Found', color: 'info' },
};

export default function StatusChip({ status, size = 'small' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
    />
  );
}

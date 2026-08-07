import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  pass: { label: 'Pass', color: 'success' },
  fail: { label: 'Fail', color: 'error' },
  warning: { label: 'Warning', color: 'warning' },
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

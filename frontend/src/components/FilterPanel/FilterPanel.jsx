import { Chip, FormControl, InputLabel, Select, MenuItem, OutlinedInput } from '@mui/material';

export default function FilterPanel({ filters, onFilterChange }) {
  const handleChange = (key) => (event) => {
    onFilterChange({ ...filters, [key]: event.target.value });
  };

  const chipColors = {
    status: { pass: 'success', fail: 'error', manual: 'warning', skipped: 'default', not_found: 'info' },
    severity: { L1: 'error', L2: 'warning' },
  };

  const activeCount = Object.values(filters).filter(v => v && v.length > 0).length;

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <FormControl size="small" className="min-w-[140px]">
        <InputLabel>Status</InputLabel>
        <Select
          multiple
          value={filters.status || []}
          onChange={handleChange('status')}
          input={<OutlinedInput label="Status" />}
          renderValue={(selected) => (
            <div className="flex gap-1 flex-wrap">
              {selected.map((v) => (
                <Chip key={v} label={v} size="small" color={chipColors.status[v] || 'default'} />
              ))}
            </div>
          )}
        >
          {['pass', 'fail', 'manual', 'skipped', 'not_found'].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" className="min-w-[120px]">
        <InputLabel>Severity</InputLabel>
        <Select
          multiple
          value={filters.severity || []}
          onChange={handleChange('severity')}
          input={<OutlinedInput label="Severity" />}
          renderValue={(selected) => (
            <div className="flex gap-1 flex-wrap">
              {selected.map((v) => (
                <Chip key={v} label={v} size="small" color={chipColors.severity[v] || 'default'} />
              ))}
            </div>
          )}
        >
          {['L1', 'L2', 'critical', 'high', 'medium', 'low'].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {activeCount > 0 && (
        <Chip
          label={`Clear (${activeCount})`}
          onDelete={() => onFilterChange({})}
          size="small"
          variant="outlined"
          className="text-slate-400"
        />
      )}
    </div>
  );
}
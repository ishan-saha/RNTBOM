import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchBar({ value, onChange, placeholder = 'Search...', ...props }) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-[280px]"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon style={{ color: '#94a3b8', fontSize: 20 }} />
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}
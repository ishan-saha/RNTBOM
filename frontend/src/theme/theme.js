import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
    success: { main: '#22c55e', light: '#4ade80', dark: '#16a34a' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    background: { default: '#0f0f1a', paper: '#1a1a2e' },
    text: { primary: '#e2e8f0', secondary: '#94a3b8' },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h4: { fontWeight: 700, fontSize: '1.75rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    body2: { fontSize: '0.875rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' },
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#1a1a2e',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.03)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
            '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    },
  },
});

export default theme;

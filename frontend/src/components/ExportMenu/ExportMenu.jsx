import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

export default function ExportMenu({ scanId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleExport = async (format) => {
    setAnchorEl(null);
    setLoading(format);
    try {
      const token = getToken();
      const url = `${API_BASE}/exports/${format}/${scanId}`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match ? match[1] : `report.${format}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={!!loading}
      >
        {loading ? `Downloading ${loading.toUpperCase()}...` : 'Export'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', marginTop: 8, minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon><PictureAsPdfIcon style={{ color: '#ef4444' }} /></ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon><TableChartIcon style={{ color: '#22c55e' }} /></ListItemIcon>
          <ListItemText>Download Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon><DownloadIcon style={{ color: '#3b82f6' }} /></ListItemIcon>
          <ListItemText>Download CSV</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import theme from './theme/theme';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import BenchmarksPage from './pages/Benchmarks/BenchmarksPage';
import BenchmarkImportPage from './pages/BenchmarkImport/BenchmarkImportPage';
import ConfigurationUploadPage from './pages/ConfigurationUpload/ConfigurationUploadPage';
import ComplianceDashboardPage from './pages/Dashboard/DashboardPage';
import ScanHistoryPage from './pages/ScanHistory/ScanHistoryPage';
import ScanDetailsPage from './pages/ScanDetails/ScanDetailsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import RunScanPage from './pages/RunScan/RunScanPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

const AppLayout = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const hideLayout = ['/login', '/signup'].includes(location.pathname);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex bg-[#0f0f1a] min-h-screen overflow-x-clip">

      {!hideLayout && (
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">

        {!hideLayout && (
          <Navbar
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}

        <div className="flex-1 min-w-0">
          <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/benchmarks"
              element={
                <PrivateRoute>
                  <BenchmarksPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/benchmarks/import"
              element={
                <PrivateRoute>
                  <BenchmarkImportPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/configurations/upload"
              element={
                <PrivateRoute>
                  <ConfigurationUploadPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/dashboard"
              element={
                <PrivateRoute>
                  <ComplianceDashboardPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/scans"
              element={
                <PrivateRoute>
                  <ScanHistoryPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/scans/:scanId"
              element={
                <PrivateRoute>
                  <ScanDetailsPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/reports/:scanId"
              element={
                <PrivateRoute>
                  <ReportsPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/compliance/scan/run"
              element={
                <PrivateRoute>
                  <RunScanPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppLayout />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e1e2e',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#6366f1', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#f87171', secondary: '#fff' },
                },
              }}
            />
          </Router>
        </AuthProvider>
      </MuiThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

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
import AdminSettingsPage from './pages/AdminSettingsPage';
import ActiveScans from "./pages/ActiveScans";
import CompletedScans from "./pages/CompletedScans";
import FailedScans from './pages/FailedScans';
import NewScan from "./pages/NewScan";
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ScanDetailPage from './pages/ScanDetailPage';
import ReportDownload from './pages/ReportDownload';
import FirewallAssessment from './pages/FirewallAssessment';
import CloudInfraAudit from './pages/CloudInfraAudit';

import ComplianceDashboardPage from './pages/Dashboard/DashboardPage';
import BenchmarksPage from './pages/Benchmarks/BenchmarksPage';
import BenchmarkImportPage from './pages/BenchmarkImport/BenchmarkImportPage';
import ConfigurationUploadPage from './pages/ConfigurationUpload/ConfigurationUploadPage';
import RunScanPage from './pages/RunScan/RunScanPage';
import ScanHistoryPage from './pages/ScanHistory/ScanHistoryPage';
import ScanDetailsPage from './pages/ScanDetails/ScanDetailsPage';
import ReportsPage from './pages/Reports/ReportsPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

/* ================= Layout Wrapper ================= */
const AppLayout = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Hide sidebar & navbar on auth pages
  const hideLayout = ['/login', '/signup'].includes(location.pathname);

  // Close the mobile drawer after route changes so content is immediately visible on small screens. ok
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    // Use a clipped, full-height shell to prevent horizontal bleed on mobile and tablet widths.
    <div className="flex bg-[#0f0f1a] min-h-screen overflow-x-clip">

      {/* Sidebar */}
      {!hideLayout && (
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
      )}

      {/* Main Content */}
      {/* Keep content shrinkable so tables/cards can scroll instead of forcing page overflow at 481-1024px. */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Navbar */}
        {!hideLayout && (
          <Navbar
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}

        {/* Pages */}
        {/* Add responsive vertical breathing room that stays compact on <=480px devices. */}
        <div className="flex-1 min-w-0">
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected */}
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
              path="/admin/dashboard"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminSettingsPage />
                </PrivateRoute>
              }
            />

            {/* ✅ SCAN ROUTES */}
            <Route
              path="/scans/active"
              element={
                <PrivateRoute>
                  <ActiveScans />
                </PrivateRoute>
              }
            />

            <Route
              path="/scans/completed"
              element={
                <PrivateRoute>
                  <CompletedScans />
                </PrivateRoute>
              }
            />

            <Route
              path="/scans/failed"
              element={
                <PrivateRoute>
                  <FailedScans />
                </PrivateRoute>
              }
            />

            <Route
              path="/scans/new"
              element={
                <PrivateRoute>
                  <NewScan />
                </PrivateRoute>
              }
            />

            {/* Scan detail / report */}
            <Route
              path="/scans/:id"
              element={
                <PrivateRoute>
                  <ScanDetailPage />
                </PrivateRoute>
              }
            />

            {/* Full report download page */}
            <Route
              path="/scans/:id/report"
              element={
                <PrivateRoute>
                  <ReportDownload />
                </PrivateRoute>
              }
            />

            {/* COMPLIANCE ROUTES */}
            <Route
              path="/compliance/dashboard"
              element={
                <PrivateRoute>
                  <ComplianceDashboardPage />
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
              path="/compliance/scan/run"
              element={
                <PrivateRoute>
                  <RunScanPage />
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
              path="/tools/firewall"
              element={
                <PrivateRoute>
                  <FirewallAssessment />
                </PrivateRoute>
              }
            />

            <Route
              path="/tools/cloud-audit"
              element={
                <PrivateRoute>
                  <CloudInfraAudit />
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

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN APP ================= */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppLayout />

            {/* Toast */}
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
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
  );
}

export default App;
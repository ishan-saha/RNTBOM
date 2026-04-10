




import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ActiveScans from "./pages/ActiveScans";
import CompletedScans from "./pages/CompletedScans";
import NewScan from "./pages/NewScan";
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

/* ================= Layout Wrapper ================= */
const AppLayout = () => {
  const location = useLocation();

  // Hide sidebar & navbar on auth pages
  const hideLayout = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="flex bg-[#0f0f1a] min-h-screen">

      {/* Sidebar */}
      {!hideLayout && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        {!hideLayout && <Navbar />}

        {/* Pages */}
        <div className="flex-1">
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
              path="/scans/new"
              element={
                <PrivateRoute>
                  <NewScan />
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
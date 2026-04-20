import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0f0f1a]" : "bg-f1f5f9"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin`}
          />
          <p
            className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm`}
          >
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "admin" && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;

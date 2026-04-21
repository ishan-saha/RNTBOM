import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Loader from "./ui/Loader";

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return <Loader />;
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

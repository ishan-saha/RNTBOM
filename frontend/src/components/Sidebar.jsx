import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  FileText,
  Upload,
  Settings,
  BarChart3,
  History,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [desktopExpanded, setDesktopExpanded] = useState(true);

  const navItem = (to, Icon, label) => {
    const active = location.pathname === to;

    return (
      <Link
        to={to}
        onClick={onCloseMobile}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
          active
            ? "bg-indigo-600 text-white"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span
          className={`${desktopExpanded ? "md:inline" : "md:hidden"} inline`}
        >
          {label}
        </span>
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    onCloseMobile();
  };

  return (
    <>
      <button
        type="button"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Close sidebar overlay"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0b0b14] border-r border-white/10 flex flex-col transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 md:h-screen ${
          desktopExpanded ? "md:w-64" : "md:w-20"
        } w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4">
          <div
            className={`inline-flex items-center p-1.5 rounded-md ${desktopExpanded ? "md:inline" : "md:hidden"} inline ${
              isDark
                ? "bg-gradient-to-br from-indigo-600/10 to-purple-600/10"
                : "bg-white"
            }`}
          >
            <img
              src={isDark ? "/rntWhiteLogo.png" : "/RNTlogo.jpg"}
              alt="RNT"
              className="h-7 w-auto block"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDesktopExpanded((prev) => !prev)}
              className="hidden md:inline-flex p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle desktop sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 border-b border-white/10">
          <Link
            to="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div
              className={`${desktopExpanded ? "md:block" : "md:hidden"} block min-w-0`}
            >
              <p className="text-white text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {user?.role}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItem("/dashboard", LayoutDashboard, "Dashboard")}

          {desktopExpanded && (
            <p className="text-xs text-slate-500 px-3 mt-4">COMPLIANCE</p>
          )}

          {navItem("/compliance/dashboard", BarChart3, "Compliance Dashboard")}
          {navItem("/compliance/scans", History, "Scan History")}
          {navItem("/compliance/scan/run", Settings, "Run Scan")}

          {desktopExpanded && (
            <p className="text-xs text-slate-500 px-3 mt-4">BENCHMARKS</p>
          )}

          {navItem("/compliance/benchmarks", FileText, "Benchmarks")}
          {navItem("/compliance/benchmarks/import", Upload, "Import Benchmark")}
          {navItem("/compliance/configurations/upload", Settings, "Config Upload")}

          {isAdmin() && (
            <>
              {desktopExpanded && (
                <p className="text-xs text-slate-500 px-3 mt-4">ADMIN</p>
              )}
              {navItem("/admin", Shield, "Admin Panel")}
            </>
          )}

          {navItem("/profile", User, "Profile")}
        </div>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span
              className={`${desktopExpanded ? "md:inline" : "md:hidden"} inline`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

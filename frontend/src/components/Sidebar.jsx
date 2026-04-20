import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Clock,
  CheckCircle,
  PlusCircle,
  XCircle,
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
      {/* Add backdrop overlay so the mobile drawer can be dismissed outside the panel. */}
      <button
        type="button"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Close sidebar overlay"
      />

      {/* Keep sidebar off-canvas on mobile and sticky on desktop to avoid content overlap at all breakpoints. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0b0b14] border-r border-white/10 flex flex-col transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 md:h-screen ${
          desktopExpanded ? "md:w-64" : "md:w-20"
        } w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Use separate close/collapse actions for mobile vs desktop to keep controls intuitive by screen size. */}
        <div className="flex items-center justify-between p-4">
          <div
            className={`inline-flex items-center p-1.5 rounded-md ${desktopExpanded ? "md:inline" : "md:hidden"} inline ${
              isDark
                ? "bg-gradient-to-br from-indigo-600/10 to-purple-600/10"
                : "bg-indigo-600"
            }`}
          >
            <img
              src="/rntWhiteLogo.png"
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

        {/* Keep user identity visible on compact widths by showing avatar and hiding verbose text when collapsed. */}
        <div className="px-4 py-3 border-t border-white/10 border-b border-white/10">
          {/* Route to profile when avatar/name is clicked in the sidebar on both mobile and desktop. */}
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

        {/* Maintain scrollable nav area so long menus remain reachable on short mobile/tablet viewports. */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          {navItem("/dashboard", LayoutDashboard, "Dashboard")}

          {/* Show section headings only when expanded so collapsed desktop mode stays compact at 769-1024px. */}
          {desktopExpanded && (
            <p className="text-xs text-slate-500 px-3 mt-4">SCANS</p>
          )}

          {navItem("/scans/active", Clock, "Active Scans")}
          {navItem("/scans/completed", CheckCircle, "Completed")}
          {navItem("/scans/failed", XCircle, "Failed Scans")}
          {navItem("/scans/new", PlusCircle, "New Scan")}

          {/* Keep admin grouping readable only in expanded states to prevent icon crowding on narrow desktops. */}
          {isAdmin() && (
            <>
              {desktopExpanded && (
                <p className="text-xs text-slate-500 px-3 mt-4">ADMIN</p>
              )}
              {navItem("/admin", Shield, "Admin Panel")}
              {navItem("/admin/settings", Settings, "SEO & SMTP")}
            </>
          )}

          {/* Profile */}
          {navItem("/profile", User, "Profile")}
        </div>

        {/* Keep logout action visible in collapsed desktop mode by conditionally hiding only its label text. */}
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

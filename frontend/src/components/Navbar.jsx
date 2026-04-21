import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Shield, LayoutDashboard, Users, Menu, Sun, Moon } from "lucide-react";

const Navbar = ({ onOpenMobileSidebar }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      {/* Reduce horizontal padding on <=480px and scale up progressively for tablets/desktops. */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* Add a mobile drawer trigger so sidebar navigation is reachable on phones. */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated() && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="inline-flex md:hidden items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {/* <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark
                      ? "bg-white/20 ring-1 ring-white/30 shadow-md shadow-indigo-900/30"
                      : "bg-white shadow-sm ring-1 ring-slate-200"
                  }`}
                >
                  <img
                    src="/SSletterLOGO.png"
                    alt="Shieldersoft"
                    className="h-10 sm:h-11 w-auto block"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span
                    className={`text-sm sm:text-base font-bold tracking-tight ${
                      isDark
                        ? "bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-200 bg-clip-text text-transparent"
                        : "text-slate-800"
                    }`}
                  >
                    Shieldersoft
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-medium tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Technologies
                  </span>
                </div>
              </div>
            </Link> */}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center gap-3">
                {/* Logo Container */}
                <div
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isDark
                      ? "bg-white shadow-lg shadow-black/30"
                      : "bg-white shadow-sm ring-1 ring-slate-200"
                  }`}
                >
                  <img
                    src="/SSletterLOGO.png"
                    alt="Shieldersoft"
                    className="h-10 sm:h-10 w-auto object-contain"
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col leading-tight">
                  <span
                    className={`text-base sm:text-lg font-semibold tracking-tight ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Shieldersoft
                  </span>

                  <span
                    className={`text-xs font-medium tracking-wide ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Technologies
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          {isAuthenticated() && (
            <div className="hidden xl:flex items-center gap-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                {/* Hide avatar text until medium screens so actions stay visible at 481-768px widths. */}
                {/* Make avatar/name block navigable so clicking user identity opens the profile page. */}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-white leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">
                      {user?.role}
                    </p>
                  </div>
                </Link>
                {/* <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button> */}
              </>
            ) : null}

            {/* Theme toggle — always visible for all auth states */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {!isAuthenticated() && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

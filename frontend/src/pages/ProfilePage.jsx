import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, Mail, Building2, Globe, Calendar, Shield } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    // Responsive padding: compact on mobile (≤480px), scales up to generous on large desktop.
    <div
      className={`p-4 sm:p-6 md:p-8 lg:p-10 ${isDark ? "bg-[#0f0f1a]" : "bg-[#f1f5f9]"} min-h-screen text-white`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          {/* Reduce heading on mobile so full name fits within viewport width at ≤480px. */}
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            {user?.name}
          </h1>
          <p className="text-slate-400 text-sm capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Profile Grid */}
      {/* 1-col on mobile/tablet, 2-col from md (769px) to avoid narrow unreadable panels. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Info */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Personal Info
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name</span>
              <span>{user?.name}</span>
            </div>

            {/* Truncate long email addresses so they don't overflow on ≤480px. */}
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-400">Email</span>
              <span className="truncate text-right">{user?.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Role</span>
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Organization
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Organization</span>
              <span>{user?.organization?.name || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Country</span>
              <span>{user?.country}</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        {/* Full-width card at md+ so the 3-column account details have enough room. */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6 md:col-span-2">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Account Info
          </h2>

          {/* 1-col on mobile, 3-col on medium/desktop so account date fields don't wrap awkwardly at 769px. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-400">Created At</span>
              <span>{formatDate(user?.createdAt)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-slate-400">Last Login</span>
              <span>{formatDate(user?.lastLogin)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-slate-400">Status</span>
              <span
                className={user?.isActive ? "text-green-400" : "text-red-400"}
              >
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (Optional Future) */}
      {/* Wrap action buttons on mobile so they don't overflow the viewport at ≤480px if both labels are wide. */}
      <div className="mt-4 sm:mt-6 flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm whitespace-nowrap cursor-pointer">
          Edit Profile
        </button>

        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm whitespace-nowrap cursor-pointer">
          Change Password
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

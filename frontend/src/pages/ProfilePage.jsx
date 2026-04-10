import { useAuth } from "../context/AuthContext";
import { User, Mail, Building2, Globe, Calendar, Shield } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-slate-400 text-sm capitalize">
            {user?.role}
          </p>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Personal Info */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Personal Info
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-slate-400">Full Name</span>
              <span>{user?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span>{user?.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Role</span>
              <span className="capitalize">{user?.role}</span>
            </div>

          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Account Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

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
              <span className={user?.isActive ? "text-green-400" : "text-red-400"}>
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Actions (Optional Future) */}
      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm">
          Edit Profile
        </button>

        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">
          Change Password
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
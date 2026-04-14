// import { useAuth } from '../context/AuthContext';
// import { Shield, Building2, Globe, Calendar, UserCheck, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const StatCard = ({ icon: Icon, label, value, color }) => (
//   <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex items-center gap-4">
//     <div className={`p-3 rounded-xl ${color}`}>
//       <Icon className="w-5 h-5" />
//     </div>
//     <div>
//       <p className="text-xs text-slate-400 mb-0.5">{label}</p>
//       <p className="text-sm font-semibold text-white">{value}</p>
//     </div>
//   </div>
// );

// const DashboardPage = () => {
//   const { user, isAdmin } = useAuth();

//   const formatDate = (dateStr) =>
//     dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

//   return (
//     <div className="min-h-[calc(100vh-64px)] bg-[#0f0f1a] p-6 md:p-10">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-10">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-600/20">
//               {user?.name?.charAt(0).toUpperCase()}
//             </div>
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold text-white">
//                 Welcome, <span className="text-indigo-400">{user?.name}</span> 👋
//               </h1>
//               <p className="text-slate-400 text-sm capitalize">{user?.role} Dashboard</p>
//             </div>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           <StatCard
//             icon={UserCheck}
//             label="Account Role"
//             value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
//             color="bg-indigo-600/20 text-indigo-400"
//           />
//           <StatCard
//             icon={Building2}
//             label="Organization"
//             value={user?.organization || 'N/A'}
//             color="bg-purple-600/20 text-purple-400"
//           />
//           <StatCard
//             icon={Globe}
//             label="Country"
//             value={user?.country || 'N/A'}
//             color="bg-emerald-600/20 text-emerald-400"
//           />
//           <StatCard
//             icon={Calendar}
//             label="Member Since"
//             value={formatDate(user?.createdAt)}
//             color="bg-amber-600/20 text-amber-400"
//           />
//         </div>

//         {/* Profile Card */}
//         <div className="bg-[#13131f]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-6 mb-6">
//           <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
//             <Shield className="w-5 h-5 text-indigo-400" />
//             Your Profile
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {[
//               { label: 'Full Name', value: user?.name },
//               { label: 'Email Address', value: user?.email },
//               { label: 'Organization', value: user?.organization },
//               { label: 'Country', value: user?.country },
//               { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
//               { label: 'Account Created', value: formatDate(user?.createdAt) },
//             ].map(({ label, value }) => (
//               <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-4">
//                 <p className="text-xs text-slate-500 mb-1">{label}</p>
//                 <p className="text-sm font-medium text-white">{value || '—'}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Admin CTA */}
//         {isAdmin() && (
//           <div className="bg-gradient-to-r from-amber-600/15 to-orange-600/15 border border-amber-500/25 rounded-2xl p-6">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <div>
//                 <h3 className="text-lg font-semibold text-amber-300 mb-1">Admin Access Enabled</h3>
//                 <p className="text-slate-400 text-sm">You have full administrative privileges. Manage all users from the Admin Panel.</p>
//               </div>
//               <Link
//                 to="/admin"
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl font-medium text-sm transition-all whitespace-nowrap"
//               >
//                 Go to Admin Panel <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DashboardPage;


import { Shield, Layers, AlertTriangle, Activity, Clock, CheckCircle, XCircle } from "lucide-react";

const DashboardPage = () => {

  const stats = [
    { label: "Libraries (LIB)", value: 128, icon: Layers, color: "text-indigo-400" },
    { label: "Total Licenses (TL)", value: 45, icon: Shield, color: "text-purple-400" },
    { label: "Vulnerabilities (VL)", value: 23, icon: AlertTriangle, color: "text-red-400" },
    { label: "Active Scans", value: 5, icon: Activity, color: "text-yellow-400" },
  ];

  const cveFeed = [
    { id: 1, cve: "CVE-2024-1234", severity: "High" },
    { id: 2, cve: "CVE-2024-5678", severity: "Medium" },
    { id: 3, cve: "CVE-2024-9999", severity: "Critical" },
  ];

  const scanSummary = {
    running: 3,
    finished: 8,
    failed: 2
  };

  return (
    // Responsive padding: compact on mobile (≤480px), medium on tablet (481-768px), generous on larger screens.
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">

      {/* Scale heading down on mobile to prevent overflow on ≤480px screens. */}
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Security Dashboard
      </h1>

      {/* ===== STATS ===== */}
      {/* 1-col on mobile, 2-col on tablet/medium, 4-col on large desktop. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex items-center gap-4"
          >
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MAIN GRID ===== */}
      {/* Stack CVE feed and scan-status card on mobile/tablet; side-by-side only on large desktops. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* CVE FEED */}
        <div className="lg:col-span-2 bg-[#13131f] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            CVE Feed (RSS)
          </h2>

          <div className="space-y-3">
            {cveFeed.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
              >
                <p className="font-medium">{item.cve}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${item.severity === "Critical"
                      ? "bg-red-500/20 text-red-400"
                      : item.severity === "High"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                >
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SCAN SUMMARY */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            Scan Status
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                Running
              </div>
              <span>{scanSummary.running}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Finished
              </div>
              <span>{scanSummary.finished}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                Failed
              </div>
              <span>{scanSummary.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CVE → EXP → OPEN SCAN ===== */}
      <div className="mt-4 sm:mt-6 bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          CVE → Exploit → Open Scan
        </h2>

        {/* Allow pipeline text to wrap on ≤480px so it doesn't bleed outside the card. */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
          <span className="bg-white/5 px-3 py-1 rounded">CVE Detected</span>
          <span>→</span>
          <span className="bg-white/5 px-3 py-1 rounded">Exploit Available</span>
          <span>→</span>
          <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded">
            Open Scan Triggered
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

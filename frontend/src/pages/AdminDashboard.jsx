import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Shield, Layers, AlertTriangle, Activity, Plus } from "lucide-react";
import axios from "axios";
import Loader from "../components/ui/Loader";

const StatCard = ({ icon, label, value, color }) => {
  const Icon = icon;

  return (
    <div className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex items-center gap-4">
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch dashboard stats",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const { stats, cveFeed } = data || {};

  const statCards = [
    {
      label: "Libraries (LIB)",
      value: stats?.totalComponents || 0,
      icon: Layers,
      color: "text-indigo-400",
    },
    {
      label: "Licenses (TL)",
      value: stats?.totalScans || 0, // Assuming 1 scan = 1 primary license context or similar
      icon: Shield,
      color: "text-purple-400",
    },
    {
      label: "Vulnerabilities (VL)",
      value: stats?.totalVulnerabilities || 0,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      label: "Active Scans",
      value: stats?.runningScans || 0,
      icon: Activity,
      color: "text-yellow-400",
    },
  ];

  return (
    // Responsive padding: tight on mobile (≤480px), medium on tablet, generous on desktop (≥1025px).
    <div
      className={`p-4 sm:p-6 md:p-8 lg:p-10 ${isDark ? "bg-[#0f0f1a]" : "bg-[#f1f5f9]"} min-h-screen text-white`}
    >
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Scale heading down on small screens to avoid horizontal overflow at ≤480px. */}
        <h1 className="text-xl sm:text-2xl font-bold">
          Admin Security Dashboard
        </h1>

        <Link
          to="/scans/new"
          className="inline-flex items-center justify-center gap-2 self-end sm:self-auto px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 text-sm font-medium transition-all hover:bg-indigo-600/30 hover:border-indigo-400/40 hover:text-indigo-200 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create New Scan
        </Link>
      </div>

      {/* Stats */}
      {/* 1-col on mobile, 2-col on tablet, 4-col on large desktop to prevent card overflow. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* CVE Feed */}
      <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">
          CVE Feed (RSS)
        </h2>

        <div className="space-y-3">
          {cveFeed?.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white/5 p-3 rounded-lg gap-2"
            >
              <p className="text-sm truncate">{item.cve}</p>
              <span className="text-xs text-red-400">{item.severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Summary */}
      <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Scan Status</h2>

        <div className="flex justify-between">
          <span className="text-yellow-400">Running</span>
          <span>{stats?.runningScans || 0}</span>
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-green-400">Finished</span>
          <span>{stats?.completedScans || 0}</span>
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-red-400">Failed</span>
          <span>{stats?.failedScans || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

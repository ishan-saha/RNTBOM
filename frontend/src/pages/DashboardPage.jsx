
import { Link } from "react-router-dom";
import { Shield, Layers, AlertTriangle, Activity, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

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

      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Scale heading down on mobile to prevent overflow on ≤480px screens. */}
        <h1 className="text-xl sm:text-2xl font-bold">
          Security Dashboard
        </h1>

        <Link
          to="/scans/new"
          className="inline-flex items-center justify-center gap-2 self-end sm:self-auto px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 text-sm font-medium transition-all hover:bg-indigo-600/30 hover:border-indigo-400/40 hover:text-indigo-200 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create New Scan
        </Link>
      </div>

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

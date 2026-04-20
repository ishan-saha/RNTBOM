import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Layers,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

function getNvdUrl() {
  const now = new Date();
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const start = past.toISOString();
  const end = now.toISOString();
  return `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=10&pubStartDate=${start}&pubEndDate=${end}`;
}

// Extract the best available severity string from a CVE object
function getSeverity(cve) {
  const v31 = cve.metrics?.cvssMetricV31?.[0];
  const v2 = cve.metrics?.cvssMetricV2?.[0];
  return (
    v31?.cvssData?.baseSeverity ||
    v2?.baseSeverity ||
    "UNKNOWN"
  ).toUpperCase();
}

// Extract the best available CVSS base score
function getScore(cve) {
  const v31 = cve.metrics?.cvssMetricV31?.[0];
  const v2 = cve.metrics?.cvssMetricV2?.[0];
  return v31?.cvssData?.baseScore ?? v2?.cvssData?.baseScore ?? null;
}

// Get English description
function getDescription(cve) {
  return (
    cve.descriptions?.find((d) => d.lang === "en")?.value ||
    "No description available."
  );
}

const SEVERITY_STYLE = {
  CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  UNKNOWN: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

const SEVERITY_ROWS = [
  {
    label: "Critical",
    key: "CRITICAL",
    color: "text-red-400",
    bar: "bg-red-500",
    Icon: AlertTriangle,
  },
  {
    label: "High",
    key: "HIGH",
    color: "text-orange-400",
    bar: "bg-orange-500",
    Icon: Activity,
  },
  {
    label: "Medium",
    key: "MEDIUM",
    color: "text-yellow-400",
    bar: "bg-yellow-500",
    Icon: Clock,
  },
  {
    label: "Low",
    key: "LOW",
    color: "text-blue-400",
    bar: "bg-blue-500",
    Icon: CheckCircle,
  },
  {
    label: "Unknown",
    key: "UNKNOWN",
    color: "text-slate-400",
    bar: "bg-slate-500",
    Icon: XCircle,
  },
];

const DashboardPage = () => {
  const [cves, setCves] = useState([]);
  const [totalResults, setTotalResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCVEs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getNvdUrl());
      if (!res.ok)
        throw new Error(`NVD API responded with status ${res.status}`);
      const data = await res.json();
      setCves(data.vulnerabilities?.map((v) => v.cve) ?? []);
      setTotalResults(data.totalResults ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCVEs();
  }, []);

  // Count by severity across the fetched batch
  const severityCounts = cves.reduce((acc, cve) => {
    const s = getSeverity(cve);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      label: "CVEs (Last 24 hrs)",
      value: totalResults !== null ? totalResults.toLocaleString() : "—",
      icon: Shield,
      color: "text-indigo-400",
    },
    {
      label: "Critical",
      value: loading ? "—" : (severityCounts.CRITICAL ?? 0),
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      label: "High",
      value: loading ? "—" : (severityCounts.HIGH ?? 0),
      icon: Activity,
      color: "text-orange-400",
    },
    {
      label: "Medium / Low",
      value: loading
        ? "—"
        : (severityCounts.MEDIUM ?? 0) + (severityCounts.LOW ?? 0),
      icon: Layers,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">
      {/* ── Header ── */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Security Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-0.5">
              Live · NVD · Last 24 hrs · Fetched{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchCVEs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <Link
            to="/scans/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 text-sm font-medium transition-all hover:bg-indigo-600/30 hover:border-indigo-400/40 hover:text-indigo-200 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create New Scan
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex items-center gap-4"
          >
            {loading ? (
              <div className="w-full h-8 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <>
                <stat.icon className={`w-6 h-6 ${stat.color} shrink-0`} />
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Failed to load NVD data: {error}</span>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* CVE Feed */}
        <div className="lg:col-span-2 bg-[#13131f] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            CVE Feed — NVD (Last 24 Hours)
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] bg-white/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : cves.length === 0 ? (
            <p className="text-slate-500 text-sm">No CVE data available.</p>
          ) : (
            <div className="space-y-3">
              {cves.map((cve) => {
                const severity = getSeverity(cve);
                const score = getScore(cve);
                const description = getDescription(cve);
                return (
                  <div key={cve.id} className="bg-white/5 p-3 rounded-lg">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="font-mono text-sm font-semibold text-indigo-300 shrink-0">
                        {cve.id}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {score !== null && (
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            {score}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.UNKNOWN}`}
                        >
                          {severity}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5">
                      Published: {new Date(cve.published).toLocaleDateString()}{" "}
                      &middot; Status: {cve.vulnStatus}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Severity Breakdown */}
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Severity Breakdown</h2>

          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {SEVERITY_ROWS.map((row) => {
                const count = severityCounts[row.key] ?? 0;
                const pct =
                  cves.length > 0 ? Math.round((count / cves.length) * 100) : 0;
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`flex items-center gap-2 text-sm ${row.color}`}
                      >
                        <row.Icon className="w-4 h-4" />
                        {row.label}
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${row.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 mt-2 border-t border-white/10">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Breakdown based on CVEs published in the last 24 hours via
                  NVD.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CVE → Exploit → Open Scan pipeline ── */}
      <div className="mt-4 sm:mt-6 bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          CVE → Exploit → Open Scan
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
          <span className="bg-white/5 px-3 py-1 rounded">CVE Detected</span>
          <span>→</span>
          <span className="bg-white/5 px-3 py-1 rounded">
            Exploit Available
          </span>
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

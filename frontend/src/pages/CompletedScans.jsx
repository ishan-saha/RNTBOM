import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import API from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Loader } from "../components/ui/Loader";

const CompletedScans = () => {
  const { isDark } = useTheme();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔥 Fetch completed scans
  const fetchScans = async () => {
    try {
      // Reset fetch state before each request so loader transition is consistent across refreshes.
      setError("");
      const res = await API.get("/scans?status=completed");

      setScans(res.data.data.scans);
      // Mark fetch success explicitly so loader only hides after valid data arrives.
      setDataFetched(true);
    } catch (err) {
      console.error(err);
      // Store a user-friendly fallback when data fetch fails.
      setError("Failed to load completed scans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  // 🧠 Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // 🧠 Duration
  const getDuration = (start, end) => {
    if (!start || !end) return "—";

    const diff = (new Date(end) - new Date(start)) / 1000;
    const min = Math.floor(diff / 60);
    const sec = Math.floor(diff % 60);

    return `${min}m ${sec}s`;
  };

  // Keep loader visible while the first successful fetch is still in progress.
  const showLoader = loading && !dataFetched;

  return (
    // Responsive outer padding: mobile tight, scales to desktop generous layout.
    <div
      className={`p-4 sm:p-6 md:p-8 lg:p-10 ${isDark ? "bg-[#0f0f1a]" : "bg-[#f1f5f9]"} min-h-screen text-white`}
    >
      {/* Show responsive orbiting loader while fetching completed scans for the first time. */}
      {showLoader && <Loader />}

      {/* Fade content in only after loader starts clearing to keep transitions smooth on all devices. */}
      <div
        className={`transition-opacity duration-500 ${showLoader ? "opacity-0" : "opacity-100"}`}
      >
        {/* Reduce heading size on mobile to prevent icon+text line overflow at ≤480px. */}
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Completed Scans
        </h1>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              No completed scans
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Completed scan jobs will appear here once a scan finishes
              successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div
                key={scan._id}
                // On mobile cards stack vertically; from md (769px) arrange left info + right actions side by side.
                className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 hover:bg-white/5 transition"
              >
                {/* LEFT */}
                <div className="space-y-2">
                  {/* Truncate long filenames on narrow screens to avoid card overflow. */}
                  <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                    {scan.filename}
                  </h2>

                  {/* Tighter gap on mobile so 4 metadata chips fit without triggering full-width layout breaks. */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
                    <div>
                      Scan Run :{" "}
                      <span className="text-slate-200 font-medium">
                        {scan.uploadedBy?.name || "Unknown"}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getDuration(scan.startedAt, scan.completedAt)}
                    </div>

                    {/* Date */}
                    <div>📅 {formatDate(scan.completedAt)}</div>

                    {/* Tool */}
                    <div className="text-indigo-400">
                      ⚙ {scan.format || "CycloneDX"}
                    </div>

                    {/* Vulnerabilities */}
                    <div className="text-red-400">
                      🚨 {scan.vulnTotal || 0} CVEs
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                {/* On mobile, align right-side actions to the start so they don't float mid-card at ≤480px. */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-green-400 text-sm font-medium">
                    Completed
                  </span>

                  {/* View Report */}
                  <button
                    onClick={() => navigate(`/scans/${scan._id}`)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap cursor-pointer"
                    aria-label={`View report for ${scan.filename}`}
                  >
                    <FileText className="w-4 h-4" />
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedScans;

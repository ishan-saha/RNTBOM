import { useEffect, useState } from "react";
import { AlertTriangle, Clock, FileWarning, RefreshCw, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/auth";
import { Loader } from "../components/ui/Loader";

const FailedScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/scans?status=failed");

      setScans(res.data.data.scans || []);
      setDataFetched(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load failed scans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const getDuration = (start, end) => {
    if (!start || !end) return "—";

    const diff = (new Date(end) - new Date(start)) / 1000;
    const min = Math.floor(diff / 60);
    const sec = Math.floor(diff % 60);

    return `${min}m ${sec}s`;
  };

  const showLoader = loading && !dataFetched;

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">

      {/* Keep loading consistent with the rest of the scan pages while failed scans are fetched. */}
      {showLoader && <Loader />}

      {/* Fade the failed scans content in after the initial loader clears. */}
      <div className={`transition-opacity duration-500 ${showLoader ? "opacity-0" : "opacity-100"}`}>
        {/* Use the alert header styling so the page clearly differentiates failed scans from completed ones. */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Failed Scans
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review scans that terminated with errors and inspect failure details.
            </p>
          </div>

          {/* Give users a quick retry action when the failed list needs refreshing after remediation. */}
          <button
            type="button"
            onClick={fetchScans}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <AlertTriangle className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">No failed scans</h2>
            <p className="text-slate-400 text-sm mt-2">
              Failed scan jobs will appear here when a scan cannot complete successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div
                key={scan._id}
                className="bg-[#13131f] border border-red-500/15 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 hover:bg-white/5 transition"
              >
                <div className="space-y-3 min-w-0">
                  {/* Preserve filename readability on narrow screens by truncating long scan names. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                      {scan.filename}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  </div>

                  {/* Keep metadata wrapping clean across mobile, tablet, and desktop widths. */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getDuration(scan.startedAt, scan.completedAt)}
                    </div>

                    <div>
                      📅 {formatDate(scan.completedAt || scan.updatedAt || scan.startedAt)}
                    </div>

                    <div className="text-indigo-400">
                      ⚙ {scan.format || "CycloneDX"}
                    </div>

                    <div className="text-red-400">
                      🚨 {scan.vulnTotal || 0} CVEs
                    </div>
                  </div>

                  {/* Surface the scan error directly in the list so users can diagnose failures quickly. */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-200">
                    <p className="flex items-center gap-2 font-medium text-red-300 mb-1">
                      <FileWarning className="w-4 h-4" />
                      Failure Details
                    </p>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words text-red-100/90">
                      {scan.errorMessage || "The scan failed before detailed error information was recorded."}
                    </p>
                  </div>
                </div>

                {/* Keep actions stacked cleanly on mobile and aligned to the side on larger screens. */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/scans/${scan._id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg whitespace-nowrap"
                  >
                    <FileWarning className="w-4 h-4" />
                    View Failure
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

export default FailedScans;
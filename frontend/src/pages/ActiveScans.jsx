import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, CheckCircle, Activity } from "lucide-react";
import API from "../api/auth";
import Loader from "../components/ui/Loader";

// Inject shimmer animation for the running progress bar (matches Loader.jsx pattern)
const shimmerStyle = `
  @keyframes progress-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .progress-shimmer {
    background: linear-gradient(
      90deg,
      #6366f1 0%,
      #818cf8 40%,
      #c7d2fe 50%,
      #818cf8 60%,
      #6366f1 100%
    );
    background-size: 200% auto;
    animation: progress-shimmer 2s linear infinite;
  }
`;
if (typeof document !== "undefined") {
  const el = document.getElementById("progress-shimmer-style");
  if (!el) {
    const s = document.createElement("style");
    s.id = "progress-shimmer-style";
    s.textContent = shimmerStyle;
    document.head.appendChild(s);
  }
}

/** Estimate scan progress (5–90 %) based on elapsed seconds since startedAt. */
const getElapsedProgress = (startedAt) => {
  if (!startedAt) return 5;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.min(90, Math.round((elapsed / 120) * 90) + 5);
};

const ActiveScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const prevScanIdsRef = useRef(null); // null = first load not done yet
  const redirectingRef = useRef(false);

  /** When a scan vanishes from the running list, fetch its final status and redirect. */
  const checkDisappearedScans = async (prevIds, currentIds) => {
    if (redirectingRef.current) return;
    const disappeared = prevIds.filter((id) => !currentIds.includes(id));
    if (disappeared.length === 0) return;

    try {
      const res = await API.get(`/scans/${disappeared[0]}`);
      const scan = res.data?.data?.scan ?? res.data?.data;
      if (!scan) return;

      redirectingRef.current = true;
      if (scan.status === "completed") {
        navigate("/scans/completed");
      } else if (scan.status === "failed") {
        navigate("/scans/failed");
      }
    } catch (err) {
      console.error("Could not determine final scan status:", err);
    }
  };

  // 🔥 FETCH ACTIVE SCANS
  const fetchScans = useCallback(async () => {
    try {
      const res = await API.get("/scans?status=running");
      const newScans = res.data.data.scans;
      const newIds = newScans.map((s) => s._id);

      // Only compare after the first successful load
      if (prevScanIdsRef.current !== null) {
        await checkDisappearedScans(prevScanIdsRef.current, newIds);
      }

      prevScanIdsRef.current = newIds;
      setScans(newScans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // checkDisappearedScans uses only navigate (stable) and refs (stable) — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchScans();

    // 🔁 auto refresh every 5 sec
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, [fetchScans]);

  // 🎨 Status UI
  const getStatusUI = (status) => {
    switch (status) {
      case "running":
        return {
          color: "text-yellow-400",
          icon: <Clock className="w-4 h-4" />,
          label: "Running",
        };
      case "failed":
        return {
          color: "text-red-400",
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Failed",
        };
      case "completed":
        return {
          color: "text-green-400",
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Completed",
        };
      default:
        return {};
    }
  };

  return (
    // Responsive outer padding: compact on mobile (≤480px), scales up for tablet and desktop.
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">
      {/* Smaller heading on mobile prevents text from pushing outside the viewport at ≤480px. */}
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-yellow-400" />
        Active Scans
      </h1>

      {loading ? (
        <Loader />
      ) : scans.length === 0 ? (
        <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">No active scans</h2>
          <p className="text-slate-400 text-sm mt-2">
            Active scan jobs will appear here while a scan is in progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => {
            const statusUI = getStatusUI(scan.status);

            return (
              <div
                key={scan._id}
                // Reduce card padding on mobile so content breathes without overflowing on ≤480px.
                className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4"
              >
                {/* Top */}
                {/* Allow filename + status to wrap on very narrow screens instead of overflowing. */}
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold min-w-0 truncate">
                    {scan.filename}
                  </h2>

                  <div
                    className={`flex items-center gap-1 text-sm ${statusUI.color}`}
                  >
                    {statusUI.icon}
                    {statusUI.label}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  {scan.status === "running" ? (
                    // Shimmer + smooth width transition for in-progress scans
                    <div
                      className="h-2 rounded-full progress-shimmer transition-all duration-[1200ms] ease-out"
                      style={{
                        width: `${getElapsedProgress(scan.startedAt)}%`,
                      }}
                    />
                  ) : scan.status === "completed" ? (
                    <div className="h-2 rounded-full bg-green-400 w-full transition-all duration-700" />
                  ) : (
                    // failed – red partial bar
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all duration-700"
                      style={{
                        width: `${getElapsedProgress(scan.startedAt)}%`,
                      }}
                    />
                  )}
                </div>

                {/* Info */}
                {/* Info row uses smaller gap on mobile to keep items from stacking too aggressively at ≤480px. */}
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-slate-400">
                  <div>
                    ⏱{" "}
                    {scan.startedAt
                      ? new Date(scan.startedAt).toLocaleTimeString()
                      : "Starting..."}
                  </div>

                  <div className="text-indigo-400">
                    ⚙ {scan.format || "CycloneDX"}
                  </div>

                  <div>📦 {scan.componentCount || 0} libs</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveScans;

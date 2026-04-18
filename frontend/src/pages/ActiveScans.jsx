 

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import API from "../api/auth";
import Loader from "../components/ui/Loader";

const ActiveScans = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔥 FETCH ACTIVE SCANS
    const fetchScans = async () => {
        try {
            const res = await API.get("/scans?status=running");

            setScans(res.data.data.scans);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScans();

        // 🔁 auto refresh every 5 sec
        const interval = setInterval(fetchScans, 5000);
        return () => clearInterval(interval);
    }, []);

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
                <p className="text-slate-400">No active scans</p>
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

                                    <div className={`flex items-center gap-1 text-sm ${statusUI.color}`}>
                                        {statusUI.icon}
                                        {statusUI.label}
                                    </div>
                                </div>

                                {/* Progress (fake for now) */}
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-yellow-400"
                                        style={{ width: scan.status === "completed" ? "100%" : "60%" }}
                                    />
                                </div>

                                {/* Info */}
                                {/* Info row uses smaller gap on mobile to keep items from stacking too aggressively at ≤480px. */}
                                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-slate-400">

                                    <div>
                                        ⏱ {scan.startedAt
                                            ? new Date(scan.startedAt).toLocaleTimeString()
                                            : "Starting..."}
                                    </div>

                                    <div className="text-indigo-400">
                                        ⚙ {scan.format || "CycloneDX"}
                                    </div>

                                    <div>
                                        📦 {scan.componentCount || 0} libs
                                    </div>
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
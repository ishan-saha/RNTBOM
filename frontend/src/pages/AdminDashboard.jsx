import { Shield, Layers, AlertTriangle, Activity } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex items-center gap-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const stats = [
        { label: "Libraries (LIB)", value: 128, icon: Layers, color: "text-indigo-400" },
        { label: "Licenses (TL)", value: 45, icon: Shield, color: "text-purple-400" },
        { label: "Vulnerabilities (VL)", value: 23, icon: AlertTriangle, color: "text-red-400" },
        { label: "Active Scans", value: 5, icon: Activity, color: "text-yellow-400" },
    ];

    const cveFeed = [
        { cve: "CVE-2024-1234", severity: "High" },
        { cve: "CVE-2024-5678", severity: "Medium" },
        { cve: "CVE-2024-9999", severity: "Critical" },
    ];

    return (
        // Responsive padding: tight on mobile (≤480px), medium on tablet, generous on desktop (≥1025px).
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">

            {/* Scale heading down on small screens to avoid horizontal overflow at ≤480px. */}
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Admin Security Dashboard
            </h1>

            {/* Stats */}
            {/* 1-col on mobile, 2-col on tablet, 4-col on large desktop to prevent card overflow. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {stats.map((s, i) => (
                    <StatCard key={i} {...s} />
                ))}
            </div>

            {/* CVE Feed */}
            <div className="bg-[#13131f] border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4">
                    CVE Feed (RSS)
                </h2>

                <div className="space-y-3">
                    {cveFeed.map((item, i) => (
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
                <h2 className="text-base sm:text-lg font-semibold mb-4">
                    Scan Status
                </h2>

                <div className="flex justify-between">
                    <span className="text-yellow-400">Running</span>
                    <span>3</span>
                </div>

                <div className="flex justify-between mt-2">
                    <span className="text-green-400">Finished</span>
                    <span>8</span>
                </div>

                <div className="flex justify-between mt-2">
                    <span className="text-red-400">Failed</span>
                    <span>2</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
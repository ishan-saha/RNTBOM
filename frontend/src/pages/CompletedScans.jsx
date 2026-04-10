


// import { CheckCircle, Clock, FileText } from "lucide-react";

// const CompletedScans = () => {
//     const scans = [
//         {
//             id: 1,
//             name: "Frontend App",
//             completedAt: "2026-04-09T10:30:00",
//             duration: "2m 15s",
//             tool: "CycloneDX",
//             report: "#"
//         },
//         {
//             id: 2,
//             name: "Backend API",
//             completedAt: "2026-04-08T18:10:00",
//             duration: "3m 42s",
//             tool: "CycloneDX",
//             report: "#"
//         },
//     ];

//     const formatDate = (date) => {
//         return new Date(date).toLocaleString();
//     };

//     return (
//         <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

//             {/* Header */}
//             <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-400" />
//                 Completed Scans
//             </h1>

//             {/* List */}
//             <div className="space-y-4">
//                 {scans.map((scan) => (
//                     <div
//                         key={scan.id}
//                         className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white/5 transition"
//                     >
//                         {/* Left */}
//                         <div className="space-y-2">

//                             <h2 className="text-lg font-semibold text-white">
//                                 {scan.name}
//                             </h2>

//                             <div className="flex flex-wrap gap-4 text-xs text-slate-400">

//                                 {/* Time */}
//                                 <div className="flex items-center gap-1">
//                                     <Clock className="w-4 h-4" />
//                                     {scan.duration}
//                                 </div>

//                                 {/* Completed date */}
//                                 <div>
//                                     📅 {formatDate(scan.completedAt)}
//                                 </div>

//                                 {/* Tool */}
//                                 <div className="text-indigo-400">
//                                     ⚙ {scan.tool}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Right */}
//                         <div className="flex items-center gap-3">

//                             {/* Status */}
//                             <span className="text-green-400 text-sm font-medium">
//                                 Completed
//                             </span>

//                             {/* Report Button */}
//                             <a
//                                 href={scan.report}
//                                 className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg"
//                             >
//                                 <FileText className="w-4 h-4" />
//                                 View Report
//                             </a>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default CompletedScans;




import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";
import API from "../api/auth";
import { useNavigate } from "react-router-dom";

const CompletedScans = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🔥 Fetch completed scans
    const fetchScans = async () => {
        try {
            const res = await API.get("/scans?status=completed");

            setScans(res.data.data.scans);
        } catch (err) {
            console.error(err);
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

    return (
        <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Completed Scans
            </h1>

            {loading ? (
                <p className="text-slate-400">Loading scans...</p>
            ) : scans.length === 0 ? (
                <p className="text-slate-400">No completed scans</p>
            ) : (
                <div className="space-y-4">
                    {scans.map((scan) => (
                        <div
                            key={scan._id}
                            className="bg-[#13131f] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white/5 transition"
                        >
                            {/* LEFT */}
                            <div className="space-y-2">

                                <h2 className="text-lg font-semibold text-white">
                                    {scan.filename}
                                </h2>

                                <div className="flex flex-wrap gap-4 text-xs text-slate-400">

                                    {/* Duration */}
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {getDuration(scan.startedAt, scan.completedAt)}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        📅 {formatDate(scan.completedAt)}
                                    </div>

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
                            <div className="flex items-center gap-3">

                                <span className="text-green-400 text-sm font-medium">
                                    Completed
                                </span>

                                {/* View Report */}
                                <button
                                    onClick={() => navigate(`/scans/${scan._id}`)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg"
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
    );
};

export default CompletedScans;
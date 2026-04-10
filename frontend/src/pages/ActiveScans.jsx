// // import { Clock } from "lucide-react";

// // const ActiveScans = () => {
// //     const scans = [
// //         { id: 1, name: "Frontend Scan", status: "Running..." },
// //         { id: 2, name: "Backend Scan", status: "In Progress" },
// //     ];

// //     return (
// //         <div className="p-6 bg-[#0f0f1a] min-h-screen text-white">
// //             <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
// //                 <Clock className="w-5 h-5 text-yellow-400" />
// //                 Active Scans
// //             </h1>

// //             <div className="space-y-3">
// //                 {scans.map((scan) => (
// //                     <div
// //                         key={scan.id}
// //                         className="flex justify-between items-center bg-white/5 p-4 rounded-lg"
// //                     >
// //                         <p>{scan.name}</p>
// //                         <span className="text-yellow-400 text-sm">{scan.status}</span>
// //                     </div>
// //                 ))}
// //             </div>
// //         </div>
// //     );
// // };

// // export default ActiveScans;





// import { Clock, AlertCircle, CheckCircle } from "lucide-react";

// const ActiveScans = () => {
//     const scans = [
//         {
//             id: 1,
//             name: "Frontend App",
//             status: "running",
//             progress: 65,
//             duration: "1m 20s",
//             tool: "CycloneDX"
//         },
//         {
//             id: 2,
//             name: "Backend API",
//             status: "failed",
//             progress: 40,
//             duration: "0m 45s",
//             tool: "CycloneDX"
//         },
//         {
//             id: 3,
//             name: "Mobile App",
//             status: "finished",
//             progress: 100,
//             duration: "2m 10s",
//             tool: "CycloneDX"
//         },
//     ];

//     const getStatusUI = (status) => {
//         switch (status) {
//             case "running":
//                 return {
//                     color: "text-yellow-400",
//                     icon: <Clock className="w-4 h-4" />,
//                     label: "Running"
//                 };
//             case "failed":
//                 return {
//                     color: "text-red-400",
//                     icon: <AlertCircle className="w-4 h-4" />,
//                     label: "Failed"
//                 };
//             case "finished":
//                 return {
//                     color: "text-green-400",
//                     icon: <CheckCircle className="w-4 h-4" />,
//                     label: "Finished"
//                 };
//             default:
//                 return {};
//         }
//     };

//     return (
//         <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

//             {/* Header */}
//             <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                 <Clock className="w-5 h-5 text-yellow-400" />
//                 Active Scans
//             </h1>

//             {/* List */}
//             <div className="space-y-4">
//                 {scans.map((scan) => {
//                     const statusUI = getStatusUI(scan.status);

//                     return (
//                         <div
//                             key={scan.id}
//                             className="bg-[#13131f] border border-white/10 rounded-xl p-5 space-y-4"
//                         >
//                             {/* Top */}
//                             <div className="flex justify-between items-center">

//                                 <h2 className="text-lg font-semibold">
//                                     {scan.name}
//                                 </h2>

//                                 <div className={`flex items-center gap-1 text-sm ${statusUI.color}`}>
//                                     {statusUI.icon}
//                                     {statusUI.label}
//                                 </div>
//                             </div>

//                             {/* Progress Bar */}
//                             <div className="w-full bg-white/10 rounded-full h-2">
//                                 <div
//                                     className={`h-2 rounded-full ${scan.status === "failed"
//                                             ? "bg-red-500"
//                                             : scan.status === "finished"
//                                                 ? "bg-green-500"
//                                                 : "bg-yellow-400"
//                                         }`}
//                                     style={{ width: `${scan.progress}%` }}
//                                 />
//                             </div>

//                             {/* Meta Info */}
//                             <div className="flex flex-wrap gap-4 text-xs text-slate-400">

//                                 <div>⏱ {scan.duration}</div>

//                                 <div className="text-indigo-400">
//                                     ⚙ {scan.tool}
//                                 </div>

//                                 <div>
//                                     📊 {scan.progress}% complete
//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };

// export default ActiveScans;





import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import API from "../api/auth";

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
        <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Active Scans
            </h1>

            {loading ? (
                <p className="text-slate-400">Loading scans...</p>
            ) : scans.length === 0 ? (
                <p className="text-slate-400">No active scans</p>
            ) : (
                <div className="space-y-4">
                    {scans.map((scan) => {
                        const statusUI = getStatusUI(scan.status);

                        return (
                            <div
                                key={scan._id}
                                className="bg-[#13131f] border border-white/10 rounded-xl p-5 space-y-4"
                            >
                                {/* Top */}
                                <div className="flex justify-between items-center">

                                    <h2 className="text-lg font-semibold">
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
                                <div className="flex flex-wrap gap-4 text-xs text-slate-400">

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
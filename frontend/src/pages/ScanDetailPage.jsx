
// by mukesh bhai

import { useEffect, useState, useRef } from "react";
import Loader from "../components/ui/Loader";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Shield, AlertTriangle, CheckCircle,
    Clock, Package, FileText, XCircle, Download
} from "lucide-react";
import API from "../api/auth";
import toast from "react-hot-toast";

// ── Severity badge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
    const map = {
        critical: "bg-red-500/20 text-red-400 border-red-500/30",
        high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        unknown: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    const cls = map[severity?.toLowerCase()] || map.unknown;
    return (
        <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
            {severity || "unknown"}
        </span>
    );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        completed: { cls: "text-green-400 bg-green-500/10 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
        running:   { cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
        failed:    { cls: "text-red-400 bg-red-500/10 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
        pending:   { cls: "text-slate-400 bg-slate-500/10 border-slate-500/30", icon: <Clock className="w-3 h-3" /> },
    };
    const { cls, icon } = map[status] || map.pending;
    return (
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
            {icon}{status}
        </span>
    );
};

// ── Duration helper ───────────────────────────────────────────────────────────
const getDuration = (start, end) => {
    if (!start || !end) return "—";
    const diff = (new Date(end) - new Date(start)) / 1000;
    const m = Math.floor(diff / 60);
    const s = Math.floor(diff % 60);
    return `${m}m ${s}s`;
};

// ─────────────────────────────────────────────────────────────────────────────
const ScanDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    // ── Download PDF via backend ──────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const res = await API.get(`/scans/${id}/report/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `SBOM_Report_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download PDF report. Please try again.');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        const fetchScan = async () => {
            try {
                const res = await API.get(`/scans/${id}`);
                setScan(res.data.data.scan);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load scan.");
            } finally {
                setLoading(false);
            }
        };
        fetchScan();
    }, [id]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="p-10 bg-[#0f0f1a] min-h-screen text-white flex flex-col items-center justify-center gap-4">
                <XCircle className="w-10 h-10 text-red-400" />
                <p className="text-red-400">{error}</p>
                <button onClick={() => navigate(-1)} className="text-indigo-400 underline text-sm">Go back</button>
            </div>
        );
    }

    const report = scan?.report;
    const components = report?.components || [];
    const vulnerabilities = report?.vulnerabilities || [];
    const now = new Date();
    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // ── shared table style helpers (matches ReportDownload.jsx) ──
    const TH = "px-3 py-2 text-left text-xs font-semibold text-white bg-[#2b2bb2] border border-[#1f1f8a]";
    const TD = "px-3 py-2 text-xs text-gray-800 border border-gray-200";
    const TDalt = "px-3 py-2 text-xs text-gray-800 border border-gray-200 bg-gray-50";

    const SectionTitle = ({ children }) => (
        <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#2b2bb2]">{children}</h2>
            <div className="h-0.5 bg-[#2b2bb2] mt-1 rounded" />
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
                <h1 className="text-2xl font-bold">{scan.filename}</h1>
                <StatusBadge status={scan.status} />
                <span className="text-xs px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 capitalize">
                    {scan.scanType}
                </span>
                <span className="text-xs px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 uppercase">
                    CycloneDX
                </span>
                {/* ── Download Report button ── */}
                <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
                >
                    {pdfLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download Report
                        </>
                    )}
                </button>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Duration", value: getDuration(scan.startedAt, scan.completedAt), icon: <Clock className="w-4 h-4 text-indigo-400" /> },
                    { label: "Started", value: scan.startedAt ? new Date(scan.startedAt).toLocaleString() : "—", icon: <Clock className="w-4 h-4 text-slate-400" /> },
                    { label: "Completed", value: scan.completedAt ? new Date(scan.completedAt).toLocaleString() : "—", icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
                    { label: "Components", value: scan.componentCount ?? 0, icon: <Package className="w-4 h-4 text-purple-400" /> },
                ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-[#13131f] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">{icon}{label}</div>
                        <p className="text-sm font-semibold truncate">{value}</p>
                    </div>
                ))}
            </div>

            {/* Severity breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Critical", value: scan.vulnCritical, cls: "text-red-400 border-red-500/20 bg-red-500/5" },
                    { label: "High",     value: scan.vulnHigh,     cls: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
                    { label: "Medium",   value: scan.vulnMedium,   cls: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" },
                    { label: "Low",      value: scan.vulnLow,      cls: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
                ].map(({ label, value, cls }) => (
                    <div key={label} className={`border rounded-xl p-4 ${cls}`}>
                        <p className="text-xs mb-1 opacity-70">{label}</p>
                        <p className="text-2xl font-bold">{value ?? 0}</p>
                    </div>
                ))}
            </div>

            {/* Failed error */}
            {scan.status === "failed" && scan.errorMessage && (
                <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm font-medium mb-1 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Scan Error
                    </p>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap break-all">{scan.errorMessage}</pre>
                </div>
            )}

            {/* No report yet */}
            {!report && scan.status === "completed" && (
                <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm">
                    Report is still being processed. Refresh in a moment.
                </div>
            )}

            {report && (
                <>
                    {/* Vulnerabilities table */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Vulnerabilities ({vulnerabilities.length})
                        </h2>

                        {vulnerabilities.length === 0 ? (
                            <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 text-center text-slate-400 text-sm">
                                No vulnerabilities found 🎉
                            </div>
                        ) : (
                            <div className="bg-[#13131f] border border-white/10 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 text-xs">
                                                <th className="text-left px-4 py-3">CVE</th>
                                                <th className="text-left px-4 py-3">Severity</th>
                                                <th className="text-left px-4 py-3">Package</th>
                                                <th className="text-left px-4 py-3">Version</th>
                                                <th className="text-left px-4 py-3">Fixed In</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vulnerabilities.map((v, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                                                    <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                                                        {v.reference ? (
                                                            <a href={v.reference} target="_blank" rel="noreferrer" className="hover:underline">
                                                                {v.cve || "—"}
                                                            </a>
                                                        ) : (v.cve || "—")}
                                                    </td>
                                                    <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                                                    <td className="px-4 py-3 text-white">{v.package || "—"}</td>
                                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{v.version || "—"}</td>
                                                    <td className="px-4 py-3 text-green-400 font-mono text-xs">{v.fixedVersion || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Components table */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-400" />
                            Components ({components.length})
                        </h2>

                        {components.length === 0 ? (
                            <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 text-center text-slate-400 text-sm">
                                No components found.
                            </div>
                        ) : (
                            <div className="bg-[#13131f] border border-white/10 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 text-xs">
                                                <th className="text-left px-4 py-3">Name</th>
                                                <th className="text-left px-4 py-3">Version</th>
                                                <th className="text-left px-4 py-3">Type</th>
                                                <th className="text-left px-4 py-3">PURL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {components.map((c, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                                                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.version || "—"}</td>
                                                    <td className="px-4 py-3 text-slate-400 capitalize">{c.type || "—"}</td>
                                                    <td className="px-4 py-3 text-indigo-300 font-mono text-xs truncate max-w-xs">{c.purl || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ScanDetailPage;










 
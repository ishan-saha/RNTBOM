
// by mukesh bhai

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Shield, AlertTriangle, CheckCircle,
    Clock, Package, FileText, XCircle, Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import API from "../api/auth";

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
    const reportRef = useRef();

    // ── Download PDF using jsPDF + html2canvas ──
    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        const element = reportRef.current;

        // Make the hidden report visible for html2canvas to capture
        const origStyle = element.getAttribute('style');
        element.style.cssText = 'position:fixed;left:0;top:0;width:794px;z-index:99999;opacity:0;pointer-events:none;';

        // Hex overrides for Tailwind v4 oklch() colors that html2canvas cannot parse
        const overrideStyle = document.createElement('style');
        overrideStyle.id = '__pdf_oklch_fix';
        overrideStyle.textContent = `
            :root {
                --color-white:#ffffff;--color-black:#000000;
                --color-gray-50:#f9fafb;--color-gray-100:#f3f4f6;--color-gray-200:#e5e7eb;
                --color-gray-300:#d1d5db;--color-gray-400:#9ca3af;--color-gray-500:#6b7280;
                --color-gray-600:#4b5563;--color-gray-700:#374151;--color-gray-800:#1f2937;
                --color-gray-900:#111827;--color-gray-950:#030712;
                --color-slate-50:#f8fafc;--color-slate-100:#f1f5f9;--color-slate-200:#e2e8f0;
                --color-slate-300:#cbd5e1;--color-slate-400:#94a3b8;--color-slate-500:#64748b;
                --color-slate-600:#475569;--color-slate-700:#334155;--color-slate-800:#1e293b;
                --color-slate-900:#0f172a;--color-slate-950:#020617;
                --color-red-50:#fef2f2;--color-red-100:#fee2e2;--color-red-200:#fecaca;
                --color-red-300:#fca5a5;--color-red-400:#f87171;--color-red-500:#ef4444;
                --color-red-600:#dc2626;--color-red-700:#b91c1c;--color-red-800:#991b1b;
                --color-red-900:#7f1d1d;--color-red-950:#450a0a;
                --color-orange-50:#fff7ed;--color-orange-100:#ffedd5;--color-orange-200:#fed7aa;
                --color-orange-300:#fdba74;--color-orange-400:#fb923c;--color-orange-500:#f97316;
                --color-orange-600:#ea580c;--color-orange-700:#c2410c;--color-orange-800:#9a3412;
                --color-orange-900:#7c2d12;--color-orange-950:#431407;
                --color-yellow-50:#fefce8;--color-yellow-100:#fef9c3;--color-yellow-200:#fef08a;
                --color-yellow-300:#fde047;--color-yellow-400:#facc15;--color-yellow-500:#eab308;
                --color-yellow-600:#ca8a04;--color-yellow-700:#a16207;--color-yellow-800:#854d0e;
                --color-yellow-900:#713f12;--color-yellow-950:#422006;
                --color-green-50:#f0fdf4;--color-green-100:#dcfce7;--color-green-200:#bbf7d0;
                --color-green-300:#86efac;--color-green-400:#4ade80;--color-green-500:#22c55e;
                --color-green-600:#16a34a;--color-green-700:#15803d;--color-green-800:#166534;
                --color-green-900:#14532d;--color-green-950:#052e16;
                --color-blue-50:#eff6ff;--color-blue-100:#dbeafe;--color-blue-200:#bfdbfe;
                --color-blue-300:#93c5fd;--color-blue-400:#60a5fa;--color-blue-500:#3b82f6;
                --color-blue-600:#2563eb;--color-blue-700:#1d4ed8;--color-blue-800:#1e40af;
                --color-blue-900:#1e3a8a;--color-blue-950:#172554;
                --color-sky-50:#f0f9ff;--color-sky-100:#e0f2fe;--color-sky-200:#bae6fd;
                --color-sky-300:#7dd3fc;--color-sky-400:#38bdf8;--color-sky-500:#0ea5e9;
                --color-sky-600:#0284c7;--color-sky-700:#0369a1;--color-sky-800:#075985;
                --color-sky-900:#0c4a6e;--color-sky-950:#082f49;
                --color-indigo-50:#eef2ff;--color-indigo-100:#e0e7ff;--color-indigo-200:#c7d2fe;
                --color-indigo-300:#a5b4fc;--color-indigo-400:#818cf8;--color-indigo-500:#6366f1;
                --color-indigo-600:#4f46e5;--color-indigo-700:#4338ca;--color-indigo-800:#3730a3;
                --color-indigo-900:#312e81;--color-indigo-950:#1e1b4b;
                --color-purple-50:#faf5ff;--color-purple-100:#f3e8ff;--color-purple-200:#e9d5ff;
                --color-purple-300:#d8b4fe;--color-purple-400:#c084fc;--color-purple-500:#a855f7;
                --color-purple-600:#9333ea;--color-purple-700:#7e22ce;--color-purple-800:#6b21a8;
                --color-purple-900:#581c87;--color-purple-950:#3b0764;
            }
        `;
        document.head.appendChild(overrideStyle);

        try {
            // Wait for fonts and images to be ready, then a short tick for styles to apply
            if (document.fonts && document.fonts.ready) await document.fonts.ready;
            const imgs = Array.from(element.querySelectorAll('img'));
            await Promise.all(imgs.map(img => new Promise(resolve => {
                if (!img.src) return resolve();
                if (img.complete) return resolve();
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
            })));
            await new Promise(r => setTimeout(r, 150));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                backgroundColor: '#ffffff',
                windowWidth: 794,
            });

            // A4 dimensions in mm
            const pageW = 210;
            const pageH = 297;
            const imgW = pageW;
            const imgH = (canvas.height * imgW) / canvas.width;

            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            let position = 0;
            let remainingH = imgH;
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Paginate: slice the single tall image across A4 pages
            while (remainingH > 0) {
                pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
                remainingH -= pageH;
                if (remainingH > 0) {
                    pdf.addPage();
                    position -= pageH; // shift image up for the next slice
                }
            }

            pdf.save(`scan-report-${scan?._id || "report"}.pdf`);
        } finally {
            // Restore hidden state & clean up
            element.setAttribute('style', origStyle || '');
            overrideStyle.remove();
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
        return (
            <div className="p-10 bg-[#0f0f1a] min-h-screen text-white flex items-center justify-center">
                <p className="text-slate-400 animate-pulse">Loading scan report...</p>
            </div>
        );
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

            {/* ── Hidden white-paper report (ReportDownload format) captured by jsPDF + html2canvas ── */}
            {scan && (
                <div
                    ref={reportRef}
                    data-pdf-report
                    className="bg-white text-black font-sans"
                    style={{ position: "absolute", left: "-9999px", top: 0, width: "794px" }}
                >
                    {/* 1. COVER PAGE */}
                    <div className="relative flex flex-col p-12 min-h-[90vh] overflow-hidden" style={{ pageBreakAfter: 'always' }}>
                        <div className="absolute left-0 top-0 h-full w-2 bg-[#2b2bb2]" />
                        <img src="/logo.png" alt="RNT Infosec LLP" className="w-40 mb-10 ml-4" />
                        <div className="ml-4">
                            <p className="text-sm font-semibold tracking-widest text-[#2b2bb2] uppercase mb-2">Security Report</p>
                            <h1 className="text-5xl font-extrabold text-[#2b2bb2] leading-tight mb-1">
                                SOFTWARE BILL<br />OF MATERIALS
                            </h1>
                            <h2 className="text-4xl font-extrabold text-sky-400 mb-8">REPORT</h2>
                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                <span><span className="font-semibold text-[#2b2bb2]">Prepared For:</span> {scan.organization || "—"}</span>
                                <span><span className="font-semibold text-[#2b2bb2]">Date:</span> {formatDate(scan.completedAt || now)}</span>
                                <span><span className="font-semibold text-[#2b2bb2]">Report Type:</span> SBOM + CBOM</span>
                            </div>
                        </div>
                        <div className="mt-auto ml-4 text-xs text-gray-500 border-t border-gray-200 pt-4">
                            +91 9211770600 &nbsp;|&nbsp; www.rntinfosec.in &nbsp;|&nbsp; project@rntinfosec.in
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none opacity-10">
                            <svg viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <path d="M0,0 Q400,400 0,800" stroke="#2b2bb2" strokeWidth="80" fill="none" />
                            </svg>
                        </div>
                    </div>

                    {/* 2. INDEX */}
                    <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Index</SectionTitle>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={`${TH} w-16 text-center`}>#</th>
                                    <th className={TH}>Section</th>
                                    <th className={`${TH} w-32 text-center`}>Page</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    "Document Control",
                                    "Background & Context",
                                    "The Prologue",
                                    "Executive Summary",
                                    "Approach & Methodology",
                                    "Vulnerability Details",
                                    "Technical Summary",
                                    "The Epilogue",
                                ].map((title, i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-semibold text-[#2b2bb2]`}>{i + 1}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{title}</td>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>—</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 3. DOCUMENT CONTROL */}
                    <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Document Control</SectionTitle>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={`${TH} w-1/3`}>Field</th>
                                    <th className={TH}>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Document Title",   "SBOM & CBOM Analysis Report — v1.0"],
                                    ["Document Version", "v — 1.0"],
                                    ["Report Type",      "SBOM + CBOM"],
                                    ["Classification",   "Confidential"],
                                    ["Prepared By",      "RNT Infosec LLP — Automated BOM Analysis Engine"],
                                    ["Prepared For",     scan.organization || "—"],
                                    ["Scan File",        scan.filename || "—"],
                                    ["Scan ID",          scan._id || "—"],
                                    ["Scan Started",     scan.startedAt ? formatDate(scan.startedAt) : "—"],
                                    ["Scan Completed",   scan.completedAt ? formatDate(scan.completedAt) : "—"],
                                    ["Format",           scan.format || "CycloneDX"],
                                    ["Status",           scan.status || "—"],
                                ].map(([field, value], i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold text-[#2b2bb2]`}>{field}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. BACKGROUND & CONTEXT */}
                    <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Background &amp; Context</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-6">
                            Modern software development stacks are drowning in third-party dependencies. A single project can pull in hundreds of open-source libraries, each carrying its own set of known vulnerabilities, license restrictions, and supply-chain risks. Without automated visibility, security teams are left blind to the true attack surface of their applications.
                        </p>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={TH}>Capability</th>
                                    <th className={TH}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Dependency Mapping",           "Identifies every direct and transitive package used in the project."],
                                    ["Vulnerability Correlation",    "Correlates components against CVE, NVD, and vendor advisory feeds."],
                                    ["License Compliance",           "Flags components with restrictive or incompatible license terms."],
                                    ["Outdated Component Detection", "Highlights packages with available security patches."],
                                    ["Exploit Tracking",             "Identifies components with known public exploits (EPSS / CISA KEV)."],
                                    ["CBOM Analysis",                "Maps cryptographic primitives and cipher usage within source code."],
                                ].map(([cap, desc], i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{cap}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. THE PROLOGUE */}
                    <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>The Prologue</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            Modern software depends heavily on external libraries, frameworks, and hidden transitive packages. While these components accelerate development, they also introduce risks that are invisible without automated analysis — outdated versions, unpatched CVEs, restrictive licenses, and code patterns that signal deeper architectural vulnerabilities.
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed mb-6">
                            <span className="font-semibold text-[#2b2bb2]">Why This Matters: </span>
                            A secure application is impossible to maintain without knowing exactly what components it depends on and how the internal code behaves under analysis. This report draws a complete map of that landscape.
                        </p>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={TH}>Risk Category</th>
                                    <th className={TH}>Impact</th>
                                    <th className={`${TH} w-28`}>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Vulnerable Dependencies", "Remote code execution, data exfiltration",     "Critical"],
                                    ["Outdated Libraries",      "Exposure to known unpatched CVEs",             "High"],
                                    ["Transitive Risks",        "Indirect vulnerabilities via nested packages", "High"],
                                    ["License Violations",      "Legal and compliance exposure",                "Medium"],
                                    ["Cryptographic Weaknesses","Weak cipher suites, deprecated algorithms",    "Medium"],
                                    ["Configuration Exposure",  "Hardcoded secrets, insecure defaults",         "High"],
                                ].map(([cat, impact, prio], i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{cat}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{impact}</td>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold ${
                                            prio === "Critical" ? "text-red-600"
                                            : prio === "High"   ? "text-orange-500"
                                            : "text-yellow-600"
                                        }`}>{prio}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 6. EXECUTIVE SUMMARY */}
                    <div className="p-10" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Executive Summary</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-6">
                            This assessment provides a point-in-time view of the project's dependency risks and internal code exposures. The scan identifies vulnerable components, outdated packages, security-sensitive files, and configuration issues requiring remediation.
                        </p>
                        <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Scan Metadata</h3>
                        <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                            <thead>
                                <tr>
                                    <th className={`${TH} w-1/3`}>Field</th>
                                    <th className={TH}>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Scan ID",            scan._id || "—"],
                                    ["Target File",        scan.filename || "—"],
                                    ["Repository Branch",  scan.branch || "—"],
                                    ["Scan Started",       scan.startedAt ? formatDate(scan.startedAt) : "—"],
                                    ["Scan Completed",     scan.completedAt ? formatDate(scan.completedAt || now) : "—"],
                                    ["Total Files",        scan.totalFiles ?? "—"],
                                    ["Languages Detected", scan.languages?.join(", ") || "—"],
                                    ["Report Type",        "SBOM + CBOM"],
                                    ["Hash Coverage",      scan.hashes || "—"],
                                    ["Organization",       scan.organization || "—"],
                                ].map(([field, value], i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold text-[#2b2bb2]`}>{field}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Component Summary</h3>
                        <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                            <thead>
                                <tr>
                                    <th className={TH}>Metric</th>
                                    <th className={`${TH} w-28 text-center`}>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Total Components",         components.length],
                                    ["Vulnerable Components",    components.filter(c => c.vulnerable).length],
                                    ["Outdated Libraries",       components.filter(c => c.outdated).length],
                                    ["Components with Exploits", components.filter(c => c.exploit).length],
                                ].map(([metric, count], i) => (
                                    <tr key={i}>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{metric}</td>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold text-[#2b2bb2]`}>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Vulnerability Severity Breakdown</h3>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={TH}>Severity</th>
                                    <th className={`${TH} w-24 text-center`}>Count</th>
                                    <th className={TH}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Critical", vulnerabilities.filter(v => v.severity === "critical").length, "Immediate exploitation risk; patch or isolate urgently.",     "text-red-600    bg-red-50"],
                                    ["High",     vulnerabilities.filter(v => v.severity === "high").length,     "High-impact vulnerabilities requiring prompt remediation.",   "text-orange-600 bg-orange-50"],
                                    ["Medium",   vulnerabilities.filter(v => v.severity === "medium").length,   "Notable risk; address within standard patch cycle.",           "text-yellow-700 bg-yellow-50"],
                                    ["Low",      vulnerabilities.filter(v => v.severity === "low").length,      "Minimal risk; address in next scheduled maintenance.",         "text-blue-600   bg-blue-50"],
                                ].map(([sev, count, desc, cls]) => (
                                    <tr key={sev}>
                                        <td className={`${TD} font-bold ${cls}`}>{sev}</td>
                                        <td className={`${TD} text-center font-bold ${cls}`}>{count}</td>
                                        <td className={TD}>{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 7. APPROACH & METHODOLOGY */}
                    <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Approach &amp; Methodology</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-6">
                            The BOM analysis engine follows a structured, multi-phase methodology to ensure complete coverage of both open-source dependencies and internal code patterns.
                        </p>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className={`${TH} w-12 text-center`}>Phase</th>
                                    <th className={`${TH} w-1/4`}>Activity</th>
                                    <th className={TH}>Description</th>
                                    <th className={`${TH} w-36`}>Tool / Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["1", "Ingestion",            "Parse uploaded package manifest or SBOM file.",                  "CycloneDX / SPDX"],
                                    ["2", "Component Extraction", "Extract all direct and transitive dependency metadata.",          "BOM Engine"],
                                    ["3", "Vulnerability Lookup", "Cross-reference components against CVE / NVD / OSV databases.",  "NVD, OSV, GHSA"],
                                    ["4", "Exploit Mapping",      "Check for known public exploits via EPSS and CISA KEV.",         "CISA KEV, EPSS"],
                                    ["5", "Outdated Detection",   "Compare installed versions against latest stable releases.",     "Package Registries"],
                                    ["6", "CBOM Analysis",        "Identify cryptographic algorithm usage in the source tree.",     "Static Analysis"],
                                    ["7", "Report Generation",    "Compile findings into structured SBOM + CBOM report.",           "Internal Engine"],
                                ].map(([phase, activity, desc, tool], i) => (
                                    <tr key={i}>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold text-[#2b2bb2]`}>{phase}</td>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{activity}</td>
                                        <td className={i % 2 === 0 ? TD : TDalt}>{desc}</td>
                                        <td className={`${i % 2 === 0 ? TD : TDalt} text-gray-500`}>{tool}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 8. VULNERABILITY DETAILS */}
                    <div className="p-10" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Vulnerability Details</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            The following table lists all {vulnerabilities.length} vulnerabilit{vulnerabilities.length !== 1 ? "ies" : "y"} identified during the scan, including CVE identifiers, affected packages, severity ratings, and recommended fix versions.
                        </p>
                        {vulnerabilities.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No vulnerabilities were detected in this scan.</p>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 text-xs">
                                    <thead>
                                        <tr>
                                            <th className={`${TH} text-center`}>#</th>
                                            <th className={TH}>CVE / ID</th>
                                            <th className={`${TH} w-20 text-center`}>Severity</th>
                                            <th className={TH}>Package</th>
                                            <th className={TH}>Installed Version</th>
                                            <th className={TH}>Fixed In</th>
                                            <th className={TH}>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vulnerabilities.map((v, i) => (
                                            <tr key={i}>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>{i + 1}</td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} font-mono font-semibold text-[#2b2bb2]`}>
                                                    {v.reference ? (
                                                        <a href={v.reference} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-blue-800">
                                                            {v.cve || "—"}
                                                        </a>
                                                    ) : (v.cve || "—")}
                                                </td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold capitalize ${
                                                    v.severity === "critical" ? "text-red-600"
                                                    : v.severity === "high"   ? "text-orange-500"
                                                    : v.severity === "medium" ? "text-yellow-700"
                                                    : v.severity === "low"    ? "text-blue-600"
                                                    : "text-gray-500"
                                                }`}>{v.severity || "—"}</td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{v.package || "—"}</td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} font-mono`}>{v.version || "—"}</td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} font-mono text-green-700`}>{v.fixedVersion || "—"}</td>
                                                <td className={`${i % 2 === 0 ? TD : TDalt} text-gray-600 break-words min-w-[160px]`}>{v.description || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 9. TECHNICAL SUMMARY – Components */}
                    <div className="p-10" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>Technical Summary</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            All {components.length} component{components.length !== 1 ? "s" : ""} detected during the scan are listed below with full metadata including vulnerability and exploit status.
                        </p>
                        {components.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No components were detected in this scan.</p>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 text-xs">
                                    <thead>
                                        <tr>
                                            <th className={`${TH} w-8 text-center`}>#</th>
                                            <th className={`${TH} whitespace-nowrap`}>Component</th>
                                            <th className={`${TH} whitespace-nowrap`}>Version</th>
                                            <th className={`${TH} whitespace-nowrap`}>Type</th>
                                            <th className={`${TH} whitespace-nowrap`}>Group</th>
                                            <th className={`${TH} whitespace-nowrap`}>Scope</th>
                                            <th className={`${TH} whitespace-nowrap`}>Author</th>
                                            <th className={`${TH} text-center whitespace-nowrap`}>Vulnerable</th>
                                            <th className={`${TH} text-center whitespace-nowrap`}>Exploit</th>
                                            <th className={`${TH} whitespace-nowrap`}>Package URL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {components.map((c, idx) => (
                                            <tr key={idx}>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>{idx + 1}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} font-semibold whitespace-nowrap`}>{c.name || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} font-mono whitespace-nowrap`}>{c.version || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.type || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.group || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.scope || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.author || "—"}</td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} text-center font-semibold whitespace-nowrap ${c.vulnerable ? "text-red-600" : "text-green-600"}`}>
                                                    {c.vulnerable ? "Yes" : "No"}
                                                </td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} text-center font-semibold whitespace-nowrap ${c.exploit ? "text-red-600" : "text-gray-400"}`}>
                                                    {c.exploit ? "Yes" : "No"}
                                                </td>
                                                <td className={`${idx % 2 === 0 ? TD : TDalt} font-mono text-gray-500 break-all`}>{c.packageUrl || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 10. THE EPILOGUE */}
                    <div className="p-10 min-h-[40vh]" style={{ pageBreakAfter: 'always' }}>
                        <SectionTitle>The Epilogue</SectionTitle>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            This report provides a precise, point-in-time view of the project's internal and external risks. By mapping every dependency, identifying known vulnerabilities, analyzing code structures, and exposing configuration weaknesses, this assessment helps teams reduce uncertainty and address issues before they translate into operational impact.
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                            Security is not a destination but a continuous process. We recommend scheduling recurring SBOM scans at every release cycle, integrating BOM generation into CI/CD pipelines, and establishing a formal vulnerability management workflow to remediate findings based on severity and exploitability.
                        </p>
                    </div>

                    {/* 11. THANK YOU */}
                    <div className="relative flex flex-col items-center justify-center p-12 min-h-[50vh] overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-2 bg-[#2b2bb2]" />
                        <img src="/logo.png" alt="RNT Infosec LLP" className="w-36 mb-8" />
                        <h2 className="text-4xl font-extrabold text-[#2b2bb2] mb-4">Thank You</h2>
                        <p className="text-gray-600 text-sm text-center max-w-lg leading-relaxed">
                            We sincerely thank you for the opportunity to conduct this SBOM &amp; CBOM analysis engagement. RNT Infosec LLP remains committed to helping organizations strengthen their security posture by identifying vulnerabilities and providing actionable recommendations.
                        </p>
                        <p className="mt-6 text-xs text-gray-400">+91 9211770600 &nbsp;|&nbsp; www.rntinfosec.in &nbsp;|&nbsp; project@rntinfosec.in</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanDetailPage;







// scanDetails jsx file 












// by mukesh bhai



// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//     ArrowLeft, Shield, AlertTriangle, CheckCircle,
//     Clock, Package, FileText, XCircle, Download
// } from "lucide-react";
// import html2pdf from "html2pdf.js";
// import API from "../api/auth";

// // ── Severity badge ────────────────────────────────────────────────────────────
// const SeverityBadge = ({ severity }) => {
//     const map = {
//         critical: "bg-red-500/20 text-red-400 border-red-500/30",
//         high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
//         medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
//         low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
//         unknown: "bg-slate-500/20 text-slate-400 border-slate-500/30",
//     };
//     const cls = map[severity?.toLowerCase()] || map.unknown;
//     return (
//         <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
//             {severity || "unknown"}
//         </span>
//     );
// };

// // ── Status badge ──────────────────────────────────────────────────────────────
// const StatusBadge = ({ status }) => {
//     const map = {
//         completed: { cls: "text-green-400 bg-green-500/10 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
//         running:   { cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
//         failed:    { cls: "text-red-400 bg-red-500/10 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
//         pending:   { cls: "text-slate-400 bg-slate-500/10 border-slate-500/30", icon: <Clock className="w-3 h-3" /> },
//     };
//     const { cls, icon } = map[status] || map.pending;
//     return (
//         <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium capitalize ${cls}`}>
//             {icon}{status}
//         </span>
//     );
// };

// // ── Duration helper ───────────────────────────────────────────────────────────
// const getDuration = (start, end) => {
//     if (!start || !end) return "—";
//     const diff = (new Date(end) - new Date(start)) / 1000;
//     const m = Math.floor(diff / 60);
//     const s = Math.floor(diff % 60);
//     return `${m}m ${s}s`;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// const ScanDetailPage = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [scan, setScan] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [pdfLoading, setPdfLoading] = useState(false);
//     const reportRef = useRef();

//     // ── Download PDF using ReportDownload format + open in new tab ──
//     const handleDownloadPDF = async () => {
//         setPdfLoading(true);
//         const element = reportRef.current;
//         // html2canvas cannot parse Tailwind v4 oklch() color functions.
//         // onclone injects hex overrides for all Tailwind color CSS variables
//         // into the cloned document so html2canvas never encounters oklch.
//         const oklchOverride = `
//             :root {
//                 --color-white:#ffffff; --color-black:#000000;
//                 --color-gray-50:#f9fafb; --color-gray-100:#f3f4f6; --color-gray-200:#e5e7eb;
//                 --color-gray-300:#d1d5db; --color-gray-400:#9ca3af; --color-gray-500:#6b7280;
//                 --color-gray-600:#4b5563; --color-gray-700:#374151; --color-gray-800:#1f2937;
//                 --color-gray-900:#111827; --color-gray-950:#030712;
//                 --color-slate-50:#f8fafc; --color-slate-100:#f1f5f9; --color-slate-200:#e2e8f0;
//                 --color-slate-300:#cbd5e1; --color-slate-400:#94a3b8; --color-slate-500:#64748b;
//                 --color-slate-600:#475569; --color-slate-700:#334155; --color-slate-800:#1e293b;
//                 --color-slate-900:#0f172a; --color-slate-950:#020617;
//                 --color-red-50:#fef2f2; --color-red-100:#fee2e2; --color-red-200:#fecaca;
//                 --color-red-300:#fca5a5; --color-red-400:#f87171; --color-red-500:#ef4444;
//                 --color-red-600:#dc2626; --color-red-700:#b91c1c; --color-red-800:#991b1b;
//                 --color-red-900:#7f1d1d; --color-red-950:#450a0a;
//                 --color-orange-50:#fff7ed; --color-orange-100:#ffedd5; --color-orange-200:#fed7aa;
//                 --color-orange-300:#fdba74; --color-orange-400:#fb923c; --color-orange-500:#f97316;
//                 --color-orange-600:#ea580c; --color-orange-700:#c2410c; --color-orange-800:#9a3412;
//                 --color-orange-900:#7c2d12; --color-orange-950:#431407;
//                 --color-yellow-50:#fefce8; --color-yellow-100:#fef9c3; --color-yellow-200:#fef08a;
//                 --color-yellow-300:#fde047; --color-yellow-400:#facc15; --color-yellow-500:#eab308;
//                 --color-yellow-600:#ca8a04; --color-yellow-700:#a16207; --color-yellow-800:#854d0e;
//                 --color-yellow-900:#713f12; --color-yellow-950:#422006;
//                 --color-green-50:#f0fdf4; --color-green-100:#dcfce7; --color-green-200:#bbf7d0;
//                 --color-green-300:#86efac; --color-green-400:#4ade80; --color-green-500:#22c55e;
//                 --color-green-600:#16a34a; --color-green-700:#15803d; --color-green-800:#166534;
//                 --color-green-900:#14532d; --color-green-950:#052e16;
//                 --color-blue-50:#eff6ff; --color-blue-100:#dbeafe; --color-blue-200:#bfdbfe;
//                 --color-blue-300:#93c5fd; --color-blue-400:#60a5fa; --color-blue-500:#3b82f6;
//                 --color-blue-600:#2563eb; --color-blue-700:#1d4ed8; --color-blue-800:#1e40af;
//                 --color-blue-900:#1e3a8a; --color-blue-950:#172554;
//                 --color-sky-50:#f0f9ff; --color-sky-100:#e0f2fe; --color-sky-200:#bae6fd;
//                 --color-sky-300:#7dd3fc; --color-sky-400:#38bdf8; --color-sky-500:#0ea5e9;
//                 --color-sky-600:#0284c7; --color-sky-700:#0369a1; --color-sky-800:#075985;
//                 --color-sky-900:#0c4a6e; --color-sky-950:#082f49;
//                 --color-indigo-50:#eef2ff; --color-indigo-100:#e0e7ff; --color-indigo-200:#c7d2fe;
//                 --color-indigo-300:#a5b4fc; --color-indigo-400:#818cf8; --color-indigo-500:#6366f1;
//                 --color-indigo-600:#4f46e5; --color-indigo-700:#4338ca; --color-indigo-800:#3730a3;
//                 --color-indigo-900:#312e81; --color-indigo-950:#1e1b4b;
//                 --color-purple-50:#faf5ff; --color-purple-100:#f3e8ff; --color-purple-200:#e9d5ff;
//                 --color-purple-300:#d8b4fe; --color-purple-400:#c084fc; --color-purple-500:#a855f7;
//                 --color-purple-600:#9333ea; --color-purple-700:#7e22ce; --color-purple-800:#6b21a8;
//                 --color-purple-900:#581c87; --color-purple-950:#3b0764;
//             }
//         `;
//         const opt = {
//             margin: 0,
//             filename: `SBOM_Report_${scan?._id || "report"}.pdf`,
//             image: { type: 'jpeg', quality: 0.98 },
//             html2canvas: {
//                 scale: 2,
//                 useCORS: true,
//                 logging: false,
//                 letterRendering: true,
//                 onclone: (clonedDoc) => {
//                     const style = clonedDoc.createElement('style');
//                     style.textContent = oklchOverride;
//                     clonedDoc.head.appendChild(style);
//                 },
//             },
//             jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
//             pagebreak: { mode: ['css', 'legacy'] }
//         };
//         try {
//             const pdfInstance = await html2pdf().set(opt).from(element).toPdf().get("pdf");
//             // Open rendered PDF in new tab
//             const blobUrl = pdfInstance.output("bloburl");
//             window.open(blobUrl, "_blank");
//             // Also trigger download
//             pdfInstance.save(opt.filename);
//         } finally {
//             setPdfLoading(false);
//         }
//     };

//     useEffect(() => {
//         const fetchScan = async () => {
//             try {
//                 const res = await API.get(`/scans/${id}`);
//                 setScan(res.data.data.scan);
//             } catch (err) {
//                 setError(err.response?.data?.message || "Failed to load scan.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchScan();
//     }, [id]);

//     if (loading) {
//         return (
//             <div className="p-10 bg-[#0f0f1a] min-h-screen text-white flex items-center justify-center">
//                 <p className="text-slate-400 animate-pulse">Loading scan report...</p>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="p-10 bg-[#0f0f1a] min-h-screen text-white flex flex-col items-center justify-center gap-4">
//                 <XCircle className="w-10 h-10 text-red-400" />
//                 <p className="text-red-400">{error}</p>
//                 <button onClick={() => navigate(-1)} className="text-indigo-400 underline text-sm">Go back</button>
//             </div>
//         );
//     }

//     const report = scan?.report;
//     const components = report?.components || [];
//     const vulnerabilities = report?.vulnerabilities || [];
//     const now = new Date();
//     const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

//     // ── shared table style helpers (matches ReportDownload.jsx) ──
//     const TH = "px-3 py-2 text-left text-xs font-semibold text-white bg-[#2b2bb2] border border-[#1f1f8a]";
//     const TD = "px-3 py-2 text-xs text-gray-800 border border-gray-200";
//     const TDalt = "px-3 py-2 text-xs text-gray-800 border border-gray-200 bg-gray-50";

//     const SectionTitle = ({ children }) => (
//         <div className="mb-4">
//             <h2 className="text-2xl font-bold text-[#2b2bb2]">{children}</h2>
//             <div className="h-0.5 bg-[#2b2bb2] mt-1 rounded" />
//         </div>
//     );

//     return (
//         <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

//             {/* Back */}
//             <button
//                 onClick={() => navigate(-1)}
//                 className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition"
//             >
//                 <ArrowLeft className="w-4 h-4" /> Back
//             </button>

//             {/* Header */}
//             <div className="flex flex-wrap items-center gap-3 mb-8">
//                 <h1 className="text-2xl font-bold">{scan.filename}</h1>
//                 <StatusBadge status={scan.status} />
//                 <span className="text-xs px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 capitalize">
//                     {scan.scanType}
//                 </span>
//                 <span className="text-xs px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 uppercase">
//                     CycloneDX
//                 </span>
//                 {/* ── Download Report button ── */}
//                 <button
//                     onClick={() => navigate(`/scans/${id}/report`)}
//                     className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
//                 >
//                     <Download className="w-4 h-4" />
//                     Download Report
//                 </button>
//             </div>

//             {/* Meta row */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//                 {[
//                     { label: "Duration", value: getDuration(scan.startedAt, scan.completedAt), icon: <Clock className="w-4 h-4 text-indigo-400" /> },
//                     { label: "Started", value: scan.startedAt ? new Date(scan.startedAt).toLocaleString() : "—", icon: <Clock className="w-4 h-4 text-slate-400" /> },
//                     { label: "Completed", value: scan.completedAt ? new Date(scan.completedAt).toLocaleString() : "—", icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
//                     { label: "Components", value: scan.componentCount ?? 0, icon: <Package className="w-4 h-4 text-purple-400" /> },
//                 ].map(({ label, value, icon }) => (
//                     <div key={label} className="bg-[#13131f] border border-white/10 rounded-xl p-4">
//                         <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">{icon}{label}</div>
//                         <p className="text-sm font-semibold truncate">{value}</p>
//                     </div>
//                 ))}
//             </div>

//             {/* Severity breakdown */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//                 {[
//                     { label: "Critical", value: scan.vulnCritical, cls: "text-red-400 border-red-500/20 bg-red-500/5" },
//                     { label: "High",     value: scan.vulnHigh,     cls: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
//                     { label: "Medium",   value: scan.vulnMedium,   cls: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" },
//                     { label: "Low",      value: scan.vulnLow,      cls: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
//                 ].map(({ label, value, cls }) => (
//                     <div key={label} className={`border rounded-xl p-4 ${cls}`}>
//                         <p className="text-xs mb-1 opacity-70">{label}</p>
//                         <p className="text-2xl font-bold">{value ?? 0}</p>
//                     </div>
//                 ))}
//             </div>

//             {/* Failed error */}
//             {scan.status === "failed" && scan.errorMessage && (
//                 <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
//                     <p className="text-red-400 text-sm font-medium mb-1 flex items-center gap-2">
//                         <XCircle className="w-4 h-4" /> Scan Error
//                     </p>
//                     <pre className="text-xs text-red-300 whitespace-pre-wrap break-all">{scan.errorMessage}</pre>
//                 </div>
//             )}

//             {/* No report yet */}
//             {!report && scan.status === "completed" && (
//                 <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm">
//                     Report is still being processed. Refresh in a moment.
//                 </div>
//             )}

//             {report && (
//                 <>
//                     {/* Vulnerabilities table */}
//                     <div className="mb-8">
//                         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                             <AlertTriangle className="w-5 h-5 text-red-400" />
//                             Vulnerabilities ({vulnerabilities.length})
//                         </h2>

//                         {vulnerabilities.length === 0 ? (
//                             <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 text-center text-slate-400 text-sm">
//                                 No vulnerabilities found 🎉
//                             </div>
//                         ) : (
//                             <div className="bg-[#13131f] border border-white/10 rounded-xl overflow-hidden">
//                                 <div className="overflow-x-auto">
//                                     <table className="w-full text-sm">
//                                         <thead>
//                                             <tr className="border-b border-white/10 text-slate-400 text-xs">
//                                                 <th className="text-left px-4 py-3">CVE</th>
//                                                 <th className="text-left px-4 py-3">Severity</th>
//                                                 <th className="text-left px-4 py-3">Package</th>
//                                                 <th className="text-left px-4 py-3">Version</th>
//                                                 <th className="text-left px-4 py-3">Fixed In</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {vulnerabilities.map((v, i) => (
//                                                 <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
//                                                     <td className="px-4 py-3 font-mono text-xs text-indigo-300">
//                                                         {v.reference ? (
//                                                             <a href={v.reference} target="_blank" rel="noreferrer" className="hover:underline">
//                                                                 {v.cve || "—"}
//                                                             </a>
//                                                         ) : (v.cve || "—")}
//                                                     </td>
//                                                     <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
//                                                     <td className="px-4 py-3 text-white">{v.package || "—"}</td>
//                                                     <td className="px-4 py-3 text-slate-400 font-mono text-xs">{v.version || "—"}</td>
//                                                     <td className="px-4 py-3 text-green-400 font-mono text-xs">{v.fixedVersion || "—"}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Components table */}
//                     <div>
//                         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                             <Package className="w-5 h-5 text-purple-400" />
//                             Components ({components.length})
//                         </h2>

//                         {components.length === 0 ? (
//                             <div className="bg-[#13131f] border border-white/10 rounded-xl p-6 text-center text-slate-400 text-sm">
//                                 No components found.
//                             </div>
//                         ) : (
//                             <div className="bg-[#13131f] border border-white/10 rounded-xl overflow-hidden">
//                                 <div className="overflow-x-auto">
//                                     <table className="w-full text-sm">
//                                         <thead>
//                                             <tr className="border-b border-white/10 text-slate-400 text-xs">
//                                                 <th className="text-left px-4 py-3">Name</th>
//                                                 <th className="text-left px-4 py-3">Version</th>
//                                                 <th className="text-left px-4 py-3">Type</th>
//                                                 <th className="text-left px-4 py-3">PURL</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {components.map((c, i) => (
//                                                 <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
//                                                     <td className="px-4 py-3 font-medium text-white">{c.name}</td>
//                                                     <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.version || "—"}</td>
//                                                     <td className="px-4 py-3 text-slate-400 capitalize">{c.type || "—"}</td>
//                                                     <td className="px-4 py-3 text-indigo-300 font-mono text-xs truncate max-w-xs">{c.purl || "—"}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}

//             {/* ── Hidden white-paper report (ReportDownload format) captured by html2pdf ── */}
//             {scan && (
//                 <div
//                     ref={reportRef}
//                     className="bg-white text-black font-sans"
//                     style={{ position: "absolute", left: "-9999px", top: 0, width: "794px" }}
//                 >
//                     {/* 1. COVER PAGE */}
//                     <div className="relative flex flex-col p-12 min-h-[90vh] overflow-hidden" style={{ pageBreakAfter: 'always' }}>
//                         <div className="absolute left-0 top-0 h-full w-2 bg-[#2b2bb2]" />
//                         <img src="/logo.png" alt="RNT Infosec LLP" className="w-40 mb-10 ml-4" />
//                         <div className="ml-4">
//                             <p className="text-sm font-semibold tracking-widest text-[#2b2bb2] uppercase mb-2">Security Report</p>
//                             <h1 className="text-5xl font-extrabold text-[#2b2bb2] leading-tight mb-1">
//                                 SOFTWARE BILL<br />OF MATERIALS
//                             </h1>
//                             <h2 className="text-4xl font-extrabold text-sky-400 mb-8">REPORT</h2>
//                             <div className="flex flex-col gap-1 text-sm text-gray-600">
//                                 <span><span className="font-semibold text-[#2b2bb2]">Prepared For:</span> {scan.organization || "—"}</span>
//                                 <span><span className="font-semibold text-[#2b2bb2]">Date:</span> {formatDate(scan.completedAt || now)}</span>
//                                 <span><span className="font-semibold text-[#2b2bb2]">Report Type:</span> SBOM + CBOM</span>
//                             </div>
//                         </div>
//                         <div className="mt-auto ml-4 text-xs text-gray-500 border-t border-gray-200 pt-4">
//                             +91 9211770600 &nbsp;|&nbsp; www.rntinfosec.in &nbsp;|&nbsp; project@rntinfosec.in
//                         </div>
//                         <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none opacity-10">
//                             <svg viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
//                                 <path d="M0,0 Q400,400 0,800" stroke="#2b2bb2" strokeWidth="80" fill="none" />
//                             </svg>
//                         </div>
//                     </div>

//                     {/* 2. INDEX */}
//                     <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Index</SectionTitle>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={`${TH} w-16 text-center`}>#</th>
//                                     <th className={TH}>Section</th>
//                                     <th className={`${TH} w-32 text-center`}>Page</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     "Document Control",
//                                     "Background & Context",
//                                     "The Prologue",
//                                     "Executive Summary",
//                                     "Approach & Methodology",
//                                     "Vulnerability Details",
//                                     "Technical Summary",
//                                     "The Epilogue",
//                                 ].map((title, i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-semibold text-[#2b2bb2]`}>{i + 1}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{title}</td>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>—</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 3. DOCUMENT CONTROL */}
//                     <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Document Control</SectionTitle>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={`${TH} w-1/3`}>Field</th>
//                                     <th className={TH}>Value</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Document Title",   "SBOM & CBOM Analysis Report — v1.0"],
//                                     ["Document Version", "v — 1.0"],
//                                     ["Report Type",      "SBOM + CBOM"],
//                                     ["Classification",   "Confidential"],
//                                     ["Prepared By",      "RNT Infosec LLP — Automated BOM Analysis Engine"],
//                                     ["Prepared For",     scan.organization || "—"],
//                                     ["Scan File",        scan.filename || "—"],
//                                     ["Scan ID",          scan._id || "—"],
//                                     ["Scan Started",     scan.startedAt ? formatDate(scan.startedAt) : "—"],
//                                     ["Scan Completed",   scan.completedAt ? formatDate(scan.completedAt) : "—"],
//                                     ["Format",           scan.format || "CycloneDX"],
//                                     ["Status",           scan.status || "—"],
//                                 ].map(([field, value], i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold text-[#2b2bb2]`}>{field}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{value}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 4. BACKGROUND & CONTEXT */}
//                     <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Background &amp; Context</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-6">
//                             Modern software development stacks are drowning in third-party dependencies. A single project can pull in hundreds of open-source libraries, each carrying its own set of known vulnerabilities, license restrictions, and supply-chain risks. Without automated visibility, security teams are left blind to the true attack surface of their applications.
//                         </p>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={TH}>Capability</th>
//                                     <th className={TH}>Description</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Dependency Mapping",           "Identifies every direct and transitive package used in the project."],
//                                     ["Vulnerability Correlation",    "Correlates components against CVE, NVD, and vendor advisory feeds."],
//                                     ["License Compliance",           "Flags components with restrictive or incompatible license terms."],
//                                     ["Outdated Component Detection", "Highlights packages with available security patches."],
//                                     ["Exploit Tracking",             "Identifies components with known public exploits (EPSS / CISA KEV)."],
//                                     ["CBOM Analysis",                "Maps cryptographic primitives and cipher usage within source code."],
//                                 ].map(([cap, desc], i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{cap}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{desc}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 5. THE PROLOGUE */}
//                     <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>The Prologue</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-4">
//                             Modern software depends heavily on external libraries, frameworks, and hidden transitive packages. While these components accelerate development, they also introduce risks that are invisible without automated analysis — outdated versions, unpatched CVEs, restrictive licenses, and code patterns that signal deeper architectural vulnerabilities.
//                         </p>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-6">
//                             <span className="font-semibold text-[#2b2bb2]">Why This Matters: </span>
//                             A secure application is impossible to maintain without knowing exactly what components it depends on and how the internal code behaves under analysis. This report draws a complete map of that landscape.
//                         </p>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={TH}>Risk Category</th>
//                                     <th className={TH}>Impact</th>
//                                     <th className={`${TH} w-28`}>Priority</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Vulnerable Dependencies", "Remote code execution, data exfiltration",     "Critical"],
//                                     ["Outdated Libraries",      "Exposure to known unpatched CVEs",             "High"],
//                                     ["Transitive Risks",        "Indirect vulnerabilities via nested packages", "High"],
//                                     ["License Violations",      "Legal and compliance exposure",                "Medium"],
//                                     ["Cryptographic Weaknesses","Weak cipher suites, deprecated algorithms",    "Medium"],
//                                     ["Configuration Exposure",  "Hardcoded secrets, insecure defaults",         "High"],
//                                 ].map(([cat, impact, prio], i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{cat}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{impact}</td>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold ${
//                                             prio === "Critical" ? "text-red-600"
//                                             : prio === "High"   ? "text-orange-500"
//                                             : "text-yellow-600"
//                                         }`}>{prio}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 6. EXECUTIVE SUMMARY */}
//                     <div className="p-10" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Executive Summary</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-6">
//                             This assessment provides a point-in-time view of the project's dependency risks and internal code exposures. The scan identifies vulnerable components, outdated packages, security-sensitive files, and configuration issues requiring remediation.
//                         </p>
//                         <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Scan Metadata</h3>
//                         <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
//                             <thead>
//                                 <tr>
//                                     <th className={`${TH} w-1/3`}>Field</th>
//                                     <th className={TH}>Value</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Scan ID",            scan._id || "—"],
//                                     ["Target File",        scan.filename || "—"],
//                                     ["Repository Branch",  scan.branch || "—"],
//                                     ["Scan Started",       scan.startedAt ? formatDate(scan.startedAt) : "—"],
//                                     ["Scan Completed",     scan.completedAt ? formatDate(scan.completedAt || now) : "—"],
//                                     ["Total Files",        scan.totalFiles ?? "—"],
//                                     ["Languages Detected", scan.languages?.join(", ") || "—"],
//                                     ["Report Type",        "SBOM + CBOM"],
//                                     ["Hash Coverage",      scan.hashes || "—"],
//                                     ["Organization",       scan.organization || "—"],
//                                 ].map(([field, value], i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold text-[#2b2bb2]`}>{field}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{value}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Component Summary</h3>
//                         <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
//                             <thead>
//                                 <tr>
//                                     <th className={TH}>Metric</th>
//                                     <th className={`${TH} w-28 text-center`}>Count</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Total Components",         components.length],
//                                     ["Vulnerable Components",    components.filter(c => c.vulnerable).length],
//                                     ["Outdated Libraries",       components.filter(c => c.outdated).length],
//                                     ["Components with Exploits", components.filter(c => c.exploit).length],
//                                 ].map(([metric, count], i) => (
//                                     <tr key={i}>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{metric}</td>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold text-[#2b2bb2]`}>{count}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         <h3 className="text-sm font-bold text-[#2b2bb2] uppercase tracking-wide mb-2">Vulnerability Severity Breakdown</h3>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={TH}>Severity</th>
//                                     <th className={`${TH} w-24 text-center`}>Count</th>
//                                     <th className={TH}>Description</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["Critical", vulnerabilities.filter(v => v.severity === "critical").length, "Immediate exploitation risk; patch or isolate urgently.",     "text-red-600    bg-red-50"],
//                                     ["High",     vulnerabilities.filter(v => v.severity === "high").length,     "High-impact vulnerabilities requiring prompt remediation.",   "text-orange-600 bg-orange-50"],
//                                     ["Medium",   vulnerabilities.filter(v => v.severity === "medium").length,   "Notable risk; address within standard patch cycle.",           "text-yellow-700 bg-yellow-50"],
//                                     ["Low",      vulnerabilities.filter(v => v.severity === "low").length,      "Minimal risk; address in next scheduled maintenance.",         "text-blue-600   bg-blue-50"],
//                                 ].map(([sev, count, desc, cls]) => (
//                                     <tr key={sev}>
//                                         <td className={`${TD} font-bold ${cls}`}>{sev}</td>
//                                         <td className={`${TD} text-center font-bold ${cls}`}>{count}</td>
//                                         <td className={TD}>{desc}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 7. APPROACH & METHODOLOGY */}
//                     <div className="p-10 min-h-[50vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Approach &amp; Methodology</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-6">
//                             The BOM analysis engine follows a structured, multi-phase methodology to ensure complete coverage of both open-source dependencies and internal code patterns.
//                         </p>
//                         <table className="w-full border-collapse border border-gray-300 text-sm">
//                             <thead>
//                                 <tr>
//                                     <th className={`${TH} w-12 text-center`}>Phase</th>
//                                     <th className={`${TH} w-1/4`}>Activity</th>
//                                     <th className={TH}>Description</th>
//                                     <th className={`${TH} w-36`}>Tool / Source</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {[
//                                     ["1", "Ingestion",            "Parse uploaded package manifest or SBOM file.",                  "CycloneDX / SPDX"],
//                                     ["2", "Component Extraction", "Extract all direct and transitive dependency metadata.",          "BOM Engine"],
//                                     ["3", "Vulnerability Lookup", "Cross-reference components against CVE / NVD / OSV databases.",  "NVD, OSV, GHSA"],
//                                     ["4", "Exploit Mapping",      "Check for known public exploits via EPSS and CISA KEV.",         "CISA KEV, EPSS"],
//                                     ["5", "Outdated Detection",   "Compare installed versions against latest stable releases.",     "Package Registries"],
//                                     ["6", "CBOM Analysis",        "Identify cryptographic algorithm usage in the source tree.",     "Static Analysis"],
//                                     ["7", "Report Generation",    "Compile findings into structured SBOM + CBOM report.",           "Internal Engine"],
//                                 ].map(([phase, activity, desc, tool], i) => (
//                                     <tr key={i}>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold text-[#2b2bb2]`}>{phase}</td>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{activity}</td>
//                                         <td className={i % 2 === 0 ? TD : TDalt}>{desc}</td>
//                                         <td className={`${i % 2 === 0 ? TD : TDalt} text-gray-500`}>{tool}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* 8. VULNERABILITY DETAILS */}
//                     <div className="p-10" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Vulnerability Details</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-4">
//                             The following table lists all {vulnerabilities.length} vulnerabilit{vulnerabilities.length !== 1 ? "ies" : "y"} identified during the scan, including CVE identifiers, affected packages, severity ratings, and recommended fix versions.
//                         </p>
//                         {vulnerabilities.length === 0 ? (
//                             <p className="text-sm text-gray-400 italic">No vulnerabilities were detected in this scan.</p>
//                         ) : (
//                             <div className="w-full overflow-x-auto">
//                                 <table className="min-w-full border-collapse border border-gray-300 text-xs">
//                                     <thead>
//                                         <tr>
//                                             <th className={`${TH} text-center`}>#</th>
//                                             <th className={TH}>CVE / ID</th>
//                                             <th className={`${TH} w-20 text-center`}>Severity</th>
//                                             <th className={TH}>Package</th>
//                                             <th className={TH}>Installed Version</th>
//                                             <th className={TH}>Fixed In</th>
//                                             <th className={TH}>Description</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {vulnerabilities.map((v, i) => (
//                                             <tr key={i}>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>{i + 1}</td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} font-mono font-semibold text-[#2b2bb2]`}>
//                                                     {v.reference ? (
//                                                         <a href={v.reference} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-blue-800">
//                                                             {v.cve || "—"}
//                                                         </a>
//                                                     ) : (v.cve || "—")}
//                                                 </td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} text-center font-bold capitalize ${
//                                                     v.severity === "critical" ? "text-red-600"
//                                                     : v.severity === "high"   ? "text-orange-500"
//                                                     : v.severity === "medium" ? "text-yellow-700"
//                                                     : v.severity === "low"    ? "text-blue-600"
//                                                     : "text-gray-500"
//                                                 }`}>{v.severity || "—"}</td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} font-semibold`}>{v.package || "—"}</td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} font-mono`}>{v.version || "—"}</td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} font-mono text-green-700`}>{v.fixedVersion || "—"}</td>
//                                                 <td className={`${i % 2 === 0 ? TD : TDalt} text-gray-600 break-words min-w-[160px]`}>{v.description || "—"}</td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>

//                     {/* 9. TECHNICAL SUMMARY – Components */}
//                     <div className="p-10" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>Technical Summary</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-4">
//                             All {components.length} component{components.length !== 1 ? "s" : ""} detected during the scan are listed below with full metadata including vulnerability and exploit status.
//                         </p>
//                         {components.length === 0 ? (
//                             <p className="text-sm text-gray-400 italic">No components were detected in this scan.</p>
//                         ) : (
//                             <div className="w-full overflow-x-auto">
//                                 <table className="min-w-full border-collapse border border-gray-300 text-xs">
//                                     <thead>
//                                         <tr>
//                                             <th className={`${TH} w-8 text-center`}>#</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Component</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Version</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Type</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Group</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Scope</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Author</th>
//                                             <th className={`${TH} text-center whitespace-nowrap`}>Vulnerable</th>
//                                             <th className={`${TH} text-center whitespace-nowrap`}>Exploit</th>
//                                             <th className={`${TH} whitespace-nowrap`}>Package URL</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {components.map((c, idx) => (
//                                             <tr key={idx}>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} text-center text-gray-400`}>{idx + 1}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} font-semibold whitespace-nowrap`}>{c.name || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} font-mono whitespace-nowrap`}>{c.version || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.type || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.group || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.scope || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} whitespace-nowrap`}>{c.author || "—"}</td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} text-center font-semibold whitespace-nowrap ${c.vulnerable ? "text-red-600" : "text-green-600"}`}>
//                                                     {c.vulnerable ? "Yes" : "No"}
//                                                 </td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} text-center font-semibold whitespace-nowrap ${c.exploit ? "text-red-600" : "text-gray-400"}`}>
//                                                     {c.exploit ? "Yes" : "No"}
//                                                 </td>
//                                                 <td className={`${idx % 2 === 0 ? TD : TDalt} font-mono text-gray-500 break-all`}>{c.packageUrl || "—"}</td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         )}
//                     </div>

//                     {/* 10. THE EPILOGUE */}
//                     <div className="p-10 min-h-[40vh]" style={{ pageBreakAfter: 'always' }}>
//                         <SectionTitle>The Epilogue</SectionTitle>
//                         <p className="text-gray-700 text-sm leading-relaxed mb-4">
//                             This report provides a precise, point-in-time view of the project's internal and external risks. By mapping every dependency, identifying known vulnerabilities, analyzing code structures, and exposing configuration weaknesses, this assessment helps teams reduce uncertainty and address issues before they translate into operational impact.
//                         </p>
//                         <p className="text-gray-700 text-sm leading-relaxed">
//                             Security is not a destination but a continuous process. We recommend scheduling recurring SBOM scans at every release cycle, integrating BOM generation into CI/CD pipelines, and establishing a formal vulnerability management workflow to remediate findings based on severity and exploitability.
//                         </p>
//                     </div>

//                     {/* 11. THANK YOU */}
//                     <div className="relative flex flex-col items-center justify-center p-12 min-h-[50vh] overflow-hidden">
//                         <div className="absolute left-0 top-0 h-full w-2 bg-[#2b2bb2]" />
//                         <img src="/logo.png" alt="RNT Infosec LLP" className="w-36 mb-8" />
//                         <h2 className="text-4xl font-extrabold text-[#2b2bb2] mb-4">Thank You</h2>
//                         <p className="text-gray-600 text-sm text-center max-w-lg leading-relaxed">
//                             We sincerely thank you for the opportunity to conduct this SBOM &amp; CBOM analysis engagement. RNT Infosec LLP remains committed to helping organizations strengthen their security posture by identifying vulnerabilities and providing actionable recommendations.
//                         </p>
//                         <p className="mt-6 text-xs text-gray-400">+91 9211770600 &nbsp;|&nbsp; www.rntinfosec.in &nbsp;|&nbsp; project@rntinfosec.in</p>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ScanDetailPage;

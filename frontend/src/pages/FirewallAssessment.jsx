import { useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import API from "../api/auth";

const sevBg = (s) => ({
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-blue-500/20 text-blue-400",
  pass: "bg-green-500/10 text-green-400",
  manual: "bg-slate-500/20 text-slate-400",
}[s] || "bg-slate-500/20 text-slate-400");

const numColor = (s) => ({
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-blue-400",
  pass: "text-green-400",
}[s] || "text-slate-400");

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]
  );
}

const SEVERITIES = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "pass", label: "Pass" },
];

const FILTERS = ["all", "critical", "high", "medium", "low", "manual", "pass"];

const FirewallAssessment = () => {
  const { isDark } = useTheme();
  const [currentText, setCurrentText] = useState("");
  const [consoleMsg, setConsoleMsg] = useState(
    "awaiting config file — cisco asa/ios, palo alto (set-format), fortios supported"
  );
  const [consoleBusy, setConsoleBusy] = useState(false);
  const [allFindings, setAllFindings] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [showResults, setShowResults] = useState(false);
  const [detectedVendor, setDetectedVendor] = useState("");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const fileContentRef = useRef("");
  const resultsRef = useRef(null);

  const updateRunState = (text) => {
    const t = text.trim();
    setCurrentText(t);
    setErrorMsg("");
    if (t.length >= 20) {
      setConsoleMsg(`config loaded (${t.split(/\r?\n/).length} lines)`);
    } else {
      setConsoleMsg(
        "awaiting config file — cisco asa/ios, palo alto (set-format), fortios supported"
      );
    }
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      fileContentRef.current = reader.result;
      setFileName(file.name + " (" + Math.round(file.size / 1024) + " KB)");
      updateRunState(reader.result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handlePaste = (e) => {
    fileContentRef.current = "";
    setFileName("");
    updateRunState(e.target.value);
  };

  const handleRun = async () => {
    setErrorMsg("");
    setConsoleBusy(true);
    setConsoleMsg("sending config to server for analysis...");

    try {
      const text = fileContentRef.current || currentText;
      const vendorSel = document.getElementById("fw-vendor-select").value;

      const res = await API.post("/firewall-assessment", {
        configText: text,
        vendor: vendorSel,
      });

      const result = res.data.data;
      setAllFindings(result.findings);
      setDetectedVendor(result.vendor);
      setShowResults(true);
      setConsoleMsg(
        `assessment complete — ${result.findings.length} controls evaluated against vendor: ${result.vendor}`
      );
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Assessment failed";
      setErrorMsg(msg);
      setConsoleMsg("assessment failed — " + msg);
    } finally {
      setConsoleBusy(false);
    }
  };

  const handleFilter = (filter) => {
    setCurrentFilter(filter);
  };

  const handleExportCsv = async () => {
    try {
      const res = await API.post(
        "/firewall-assessment/export-csv",
        { findings: allFindings },
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "firewall-gap-assessment.csv";
      a.click();
    } catch (err) {
      setErrorMsg(
        "CSV export failed: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const counts = { critical: 0, high: 0, medium: 0, low: 0, pass: 0, manual: 0 };
  allFindings.forEach((f) => counts[f.severity]++);
  const scoreable = allFindings.filter((f) => f.severity !== "manual");
  const pct = scoreable.length
    ? Math.round((100 * counts.pass) / scoreable.length)
    : 0;

  const filtered =
    currentFilter === "all"
      ? allFindings
      : allFindings.filter((f) => f.severity === currentFilter);
  const byCategory = {};
  filtered.forEach((f) => {
    (byCategory[f.category] = byCategory[f.category] || []).push(f);
  });

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen ${
        isDark ? "bg-[#0f0f1a]" : "bg-[#f1f5f9]"
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-sm text-[#06201C] font-mono flex-shrink-0">
          FW
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Firewall Config Gap Assessment
          </h1>
          <p className="text-sm text-slate-400">
            Static analysis against CIS Benchmarks, NIST SP 800-41 &amp;
            PCI-DSS 1.x — 60+ controls
          </p>
        </div>
      </div>

      <div
        className={`font-mono text-xs text-slate-400 bg-[#13131f] border border-white/10 rounded-lg px-4 py-3 mb-6 flex items-center gap-2.5 overflow-x-auto whitespace-nowrap ${
          consoleBusy ? "animate-pulse" : ""
        }`}
      >
        <span
          className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
            consoleBusy
              ? "bg-yellow-400 shadow-[0_0_8px_#F0C94A]"
              : "bg-green-400 shadow-[0_0_8px_#4ADE80]"
          }`}
        ></span>
        <span>{consoleMsg}</span>
      </div>

      <section className="bg-[#13131f] border border-white/10 rounded-xl p-6 mb-5">
        <h2 className="font-mono text-xs uppercase tracking-widest text-slate-400 mb-4 font-semibold">
          01 — Load Configuration
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors duration-150 ${
            isDragging
              ? "border-teal-400 bg-teal-400/5"
              : "border-white/10 hover:border-teal-400/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="text-[15px] text-slate-300 mb-1.5 font-medium">
            Drop a config file here, or click to browse
          </div>
          <p className="text-slate-400 text-xs">
            .txt / .cfg / .conf / .log — sent to server for analysis
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.cfg,.conf,.log,.xml,.set"
            className="hidden"
            onChange={(e) => {
              if (e.target.files.length) handleFile(e.target.files[0]);
            }}
          />
        </div>

        <div className="flex items-center gap-3 my-[18px] text-slate-400 text-xs font-mono">
          <span className="flex-1 h-px bg-white/10"></span>
          <span>OR PASTE CONFIG TEXT</span>
          <span className="flex-1 h-px bg-white/10"></span>
        </div>

        <textarea
          className="w-full min-h-[160px] bg-[#0B0E14] border border-white/10 rounded-lg text-slate-300 font-mono text-xs p-3.5 resize-y outline-none focus:border-teal-400 placeholder:text-slate-600"
          placeholder="paste raw firewall configuration text here..."
          onChange={handlePaste}
        ></textarea>

        <div className="flex items-center gap-3 flex-wrap mt-4">
          <label className="text-xs text-slate-400">Vendor:</label>
          <select
            id="fw-vendor-select"
            className="bg-[#1A2130] border border-white/10 text-slate-300 font-mono text-xs px-3 py-[9px] rounded-[7px] outline-none"
          >
            <option value="auto">Auto-detect</option>
            <option value="cisco">Cisco ASA / IOS</option>
            <option value="paloalto">Palo Alto (set-format)</option>
            <option value="fortinet">Fortinet FortiOS</option>
          </select>
          {fileName && (
            <span className="font-mono text-xs text-teal-400 bg-teal-400/10 px-2.5 py-1.5 rounded-md border border-teal-400/25">
              {fileName}
            </span>
          )}
          <button
            className="ml-auto font-semibold text-sm text-[#06201C] rounded-lg px-5 py-2.5 border-0 cursor-pointer transition-transform duration-[80ms] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#5EEAD4",
            }}
            disabled={currentText.length < 20 || consoleBusy}
            onClick={handleRun}
          >
            Run Assessment
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2.5 text-red-400 text-xs font-mono">{errorMsg}</div>
        )}
      </section>

      {showResults && (
        <section ref={resultsRef}>
          <div className="bg-[#13131f] border border-white/10 rounded-xl px-5 py-[18px] mb-[22px]">
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                Compliance Score
              </span>
              <span className="font-mono text-xl font-bold text-slate-300">
                {pct}%
              </span>
            </div>
            <div className="h-2.5 rounded-md bg-[#0B0E14] border border-white/10 overflow-hidden flex">
              <div
                className="h-full rounded-md transition-all"
                style={{
                  width: pct + "%",
                  background:
                    pct >= 80
                      ? "#4ADE80"
                      : pct >= 50
                      ? "#F0C94A"
                      : "#F5576C",
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-[22px]">
            {SEVERITIES.map((s) => (
              <div
                key={s.key}
                className="bg-[#13131f] border border-white/10 rounded-xl px-3.5 py-4 text-center"
              >
                <div className={`font-mono text-[26px] font-bold leading-none ${numColor(s.key)}`}>
                  {counts[s.key]}
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center flex-wrap gap-2.5 mb-1.5">
            <span className="font-mono text-xs text-teal-400">
              VENDOR: {detectedVendor.toUpperCase()}
            </span>
            <div className="flex gap-2">
              <button
                className="bg-transparent border border-white/10 text-slate-300 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer hover:border-teal-400 hover:text-teal-400 transition-colors"
                onClick={handleExportCsv}
              >
                Export CSV
              </button>
              <button
                className="bg-transparent border border-white/10 text-slate-300 rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer hover:border-teal-400 hover:text-teal-400 transition-colors"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-3.5 flex-wrap items-center">
            {FILTERS.map((f) => (
              <span
                key={f}
                className={`font-mono text-[11.5px] px-3 py-1.5 rounded-full cursor-pointer border transition-colors ${
                  currentFilter === f
                    ? "border-teal-400 text-teal-400 bg-teal-400/5"
                    : "border-white/10 text-slate-400 bg-[#13131f] hover:border-teal-400/50"
                }`}
                onClick={() => handleFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </span>
            ))}
          </div>

          <div id="findingsList">
            {Object.keys(byCategory).map((cat) => (
              <div key={cat}>
                <div className="font-mono text-[11.5px] text-slate-400 uppercase tracking-wider mt-6 mb-2.5 flex items-center gap-2.5">
                  <span>{cat}</span>
                  <span className="flex-1 h-px bg-white/10"></span>
                </div>
                {byCategory[cat].map((f, idx) => (
                  <FindingCard key={idx} finding={f} />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 text-slate-400 text-[11.5px] text-center font-mono">
        config data sent server-side for analysis
      </footer>
    </div>
  );
};

const FindingCard = ({ finding: f }) => {
  const [open, setOpen] = useState(false);
  const sevLabel =
    f.severity === "manual"
      ? "Manual Review"
      : f.severity === "pass"
      ? "Pass"
      : f.severity;

  return (
    <div className="bg-[#13131f] border border-white/10 rounded-xl mb-2.5 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span
          className={`font-mono text-[10.5px] font-bold px-2 py-[3px] rounded uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${sevBg(
            f.severity
          )}`}
        >
          {sevLabel}
        </span>
        <span className="font-mono text-[11px] text-slate-400 flex-shrink-0">
          {f.id}
        </span>
        <span className="text-[13.5px] font-medium text-slate-300 flex-1">
          {f.title}
        </span>
        <span
          className={`text-slate-400 text-[11px] flex-shrink-0 transition-transform duration-150 ${
            open ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 pb-[18px] pt-3.5">
          <div className="flex gap-4 flex-wrap mb-3">
            <div>
              <div className="text-[10.5px] text-slate-400 uppercase tracking-wider mb-1">
                Standard References
              </div>
              <div className="text-xs flex flex-wrap gap-1">
                {f.standards.map((s, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-[#1A2130] text-slate-400 px-[7px] py-0.5 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="font-mono text-[11.5px] bg-[#0B0E14] border border-white/10 rounded-[7px] px-3 py-2.5 text-slate-400 whitespace-pre-wrap break-all mt-2">
            {escapeHtml(f.evidence)}
          </div>
          {f.status !== "pass" && (
            <div className="text-xs text-slate-300 mt-2.5 pt-2.5 border-t border-dashed border-white/10">
              <span className="text-teal-400 font-mono text-[10.5px] uppercase tracking-wider block mb-1">
                Recommendation
              </span>
              {f.remediation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FirewallAssessment;

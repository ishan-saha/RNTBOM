
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Upload, GitBranch, Link as LinkIcon, Box } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/auth";

const NewScan = () => {
    const navigate = useNavigate();
    const [sourceType, setSourceType] = useState("upload");
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        projectName: "",
        repoUrl: "",
        imageName: "",
        link: "",
        notes: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setFileName(selectedFile.name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("projectName", form.projectName);
            formData.append("sourceType", sourceType);
            formData.append("notes", form.notes || "");

            if (sourceType === "upload") {
                if (!file) {
                    toast.error("Please select a file to upload.");
                    return;
                }
                formData.append("file", file);
            }
            if (sourceType === "github") formData.append("repoUrl", form.repoUrl);
            if (sourceType === "docker") {
    formData.append("imageName", form.imageName);
    if (form.link) {
        formData.append("link", form.link); // optional
    }
}
            const toastId = toast.loading("Starting scan...");

            await API.post("/scans", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Scan started! Redirecting...", { id: toastId });

            // reset form
            setForm({ projectName: "", repoUrl: "", imageName: "", link: "", notes: "" });
            setFile(null);
            setFileName("");

            setTimeout(() => navigate("/scans/active"), 1200);

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to start scan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Responsive outer padding to prevent flush-edge forms on mobile (≤480px).
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#0f0f1a] min-h-screen text-white">

            {/* Reduce heading size on mobile so icon+label fits within viewport at ≤480px. */}
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Start New Scan
            </h1>

            {/* Form fills full width on mobile/tablet; capped at 3xl on large desktops to keep it readable. */}
            <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-[#13131f] p-4 sm:p-6 rounded-2xl border border-white/10 space-y-4 sm:space-y-6">

                {/* Project Name */}
                <div>
                    <label className="text-sm text-slate-400 block mb-1">Project Name *</label>
                    <input
                        name="projectName"
                        value={form.projectName}
                        onChange={handleChange}
                        required
                        placeholder="e.g. my-frontend-app"
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Source Type */}
                <div>
                    <p className="text-sm text-slate-400 mb-2">Scan Source</p>
                    {/* 2-col grid on ≤768px keeps source type buttons visible without tiny cramped layout. */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { key: "upload", label: "Upload File", icon: Upload },
                            { key: "github", label: "Git Repo",    icon: GitBranch },
                            { key: "docker", label: "Docker Image",icon: Box },
                            // { key: "link",   label: "URL / Link",  icon: LinkIcon },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => setSourceType(key)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition ${
                                    sourceType === key
                                        ? "bg-indigo-600 border-indigo-500"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <p className="text-xs">{label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upload */}
                {sourceType === "upload" && (
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">
                            Upload SBOM / Manifest (JSON, XML, SPDX, CycloneDX)
                        </label>
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-indigo-500 transition-all group">
                            <Upload className="w-10 h-10 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm text-slate-300">
                                <span className="text-indigo-400 font-semibold">Click to upload</span> or drag & drop
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Max 20 MB</p>
                            {fileName && (
                                <div className="mt-3 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                    📄 {fileName}
                                </div>
                            )}
                            <input type="file" name="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                )}

                {/* GitHub */}
                {sourceType === "github" && (
                    <div>
                        <label className="text-sm text-slate-400 block mb-1">GitHub Repository URL *</label>
                        <input
                            name="repoUrl"
                            value={form.repoUrl}
                            onChange={handleChange}
                            required
                            placeholder="https://github.com/user/repo"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                )}

                {/* Docker */}
                {sourceType === "docker" && (
    <div className="space-y-4">
        {/* Docker Image */}
        <div>
            <label className="text-sm text-slate-400 block mb-1">Docker Image *</label>
            <input
                name="imageName"
                value={form.imageName}
                onChange={handleChange}
                required
                placeholder="nginx:latest"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
            />
        </div>

        {/* Optional SBOM URL */}
        <div>
            <label className="text-sm text-slate-400 block mb-1">
                SBOM URL (optional)
            </label>
            <input
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://example.com/sbom.json"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
            />
        </div>
    </div>
)}

                {/* Link */}
                {/* {sourceType === "link" && (
                    <div>
                        <label className="text-sm text-slate-400 block mb-1">URL to SBOM file *</label>
                        <input
                            name="link"
                            value={form.link}
                            onChange={handleChange}
                            required
                            placeholder="https://example.com/sbom.json"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                )} */}

                {/* Notes */}
                <div>
                    <label className="text-sm text-slate-400 block mb-1">Notes (optional)</label>
                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any notes about this scan..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                        loading
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                    {loading ? "Starting Scan..." : "Start Scan"}
                </button>
            </form>
        </div>
    );
};

export default NewScan;
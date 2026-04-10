





// import { useState } from "react";
// import { PlusCircle, Upload, GitBranch, Link as LinkIcon, Box } from "lucide-react";
// import toast from "react-hot-toast";
// import API from "../api/auth";

// const NewScan = () => {
//     const [sourceType, setSourceType] = useState("file");
//     const [file, setFile] = useState(null);
//     const [fileName, setFileName] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleFileChange = (e) => {
//         const selectedFile = e.target.files[0];

//         if (!selectedFile) return;

//         // Optional validation
//         const allowedTypes = [
//             "application/json",
//             "text/xml",
//             "application/xml",
//             "text/plain"
//         ];

//         if (!allowedTypes.includes(selectedFile.type)) {
//             alert("Invalid file type. Please upload JSON/XML/SPDX file.");
//             return;
//         }

//         // Optional size check (5MB)
//         if (selectedFile.size > 5 * 1024 * 1024) {
//             alert("File too large. Max 5MB allowed.");
//             return;
//         }

//         setFile(selectedFile);
//         setFileName(selectedFile.name);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (loading) return; // 🚫 prevent double click

//         try {
//             setLoading(true);

//             const formData = new FormData();

//             formData.append("projectName", form.projectName);
//             formData.append("sourceType", sourceType);
//             formData.append("notes", form.notes || "");

//             if (sourceType === "upload" && file) {
//                 formData.append("file", file);
//             }

//             if (sourceType === "github") {
//                 formData.append("repoUrl", form.repoUrl);
//             }

//             if (sourceType === "docker") {
//                 formData.append("imageName", form.imageName);
//             }

//             if (sourceType === "link") {
//                 formData.append("link", form.link);
//             }

//             const toastId = toast.loading("Starting scan...");

//             await API.post("/scans", formData);

//             toast.success("Scan started successfully 🚀", {
//                 id: toastId,
//             });

//             // reset
//             setForm({
//                 projectName: "",
//                 repoUrl: "",
//                 imageName: "",
//                 link: "",
//                 notes: "",
//             });

//             setFile(null);
//             setFileName("");

//             setTimeout(() => {
//                 window.location.href = "/scans/active";
//             }, 1000);

//         } catch (err) {
//             console.error(err);

//             toast.error(
//                 err.response?.data?.message || "Failed to start scan ❌"
//             );
//         } finally {
//             setLoading(false); // ✅ always reset
//         }
//     };

//     return (
//         <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

//             {/* Header */}
//             <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                 <PlusCircle className="w-5 h-5 text-indigo-400" />
//                 Start New Scan
//             </h1>

//             <form
//                 onSubmit={handleSubmit}
//                 className="max-w-3xl bg-[#13131f] p-6 rounded-2xl border border-white/10 space-y-6"
//             >

//                 {/* Project Info */}
//                 <div>
//                     <label className="text-sm text-slate-400">Project Name</label>
//                     <input
//                         name="projectName"
//                         required
//                         placeholder="e.g. frontend-app"
//                         className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
//                     />
//                 </div>

//                 {/* Source Type */}
//                 <div>
//                     <p className="text-sm text-slate-400 mb-2">Scan Source</p>

//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                         {[
//                             { key: "upload", label: "Upload", icon: Upload },
//                             { key: "github", label: "Git Repo", icon: GitBranch },
//                             { key: "docker", label: "Image", icon: Box },
//                             { key: "link", label: "Link", icon: LinkIcon },
//                         ].map(({ key, label, icon: Icon }) => (
//                             <button
//                                 type="button"
//                                 key={key}
//                                 onClick={() => setSourceType(key)}
//                                 className={`flex items-center gap-2 justify-center p-3 rounded-lg border ${sourceType === key
//                                     ? "bg-indigo-600 border-indigo-500"
//                                     : "bg-white/5 border-white/10"
//                                     }`}
//                             >
//                                 <Icon className="w-4 h-4" />
//                                 {label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Dynamic Inputs */}

//                 {sourceType === "file" && (
//                     <div>
//                         <label className="text-sm text-slate-400 mb-2 block">
//                             Upload SBOM / Manifest
//                         </label>

//                         <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all">

//                             {/* Icon */}
//                             <Upload className="w-10 h-10 text-indigo-400 mb-2" />

//                             {/* Text */}
//                             <p className="text-sm text-slate-300">
//                                 <span className="text-indigo-400 font-medium">
//                                     Click to upload
//                                 </span>{" "}
//                                 or drag & drop
//                             </p>

//                             <p className="text-xs text-slate-500 mt-1">
//                                 JSON, XML, SPDX, CycloneDX
//                             </p>

//                             {/* File name */}
//                             {fileName && (
//                                 <p className="mt-3 text-green-400 text-sm">
//                                     📄 {fileName}
//                                 </p>
//                             )}

//                             {/* Hidden input */}
//                             <input
//                                 type="file"
//                                 name="file"
//                                 className="hidden"
//                                 onChange={handleFileChange}
//                             />
//                         </label>
//                     </div>
//                 )}

//                 {sourceType === "git" && (
//                     <div>
//                         <label className="text-sm text-slate-400">Git Repository URL</label>
//                         <input
//                             name="repoUrl"
//                             placeholder="https://github.com/user/repo"
//                             className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
//                         />
//                     </div>
//                 )}

//                 {sourceType === "image" && (
//                     <div>
//                         <label className="text-sm text-slate-400">Docker Image</label>
//                         <input
//                             name="imageName"
//                             placeholder="nginx:latest"
//                             className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
//                         />
//                     </div>
//                 )}

//                 {sourceType === "link" && (
//                     <div>
//                         <label className="text-sm text-slate-400">Website / API Link</label>
//                         <input
//                             name="link"
//                             placeholder="https://example.com"
//                             className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
//                         />
//                     </div>
//                 )}

//                 {/* Notes */}
//                 <div>
//                     <label className="text-sm text-slate-400">Notes</label>
//                     <textarea
//                         name="notes"
//                         rows="3"
//                         placeholder="Optional notes..."
//                         className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
//                     />
//                 </div>

//                 {/* Submit */}
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className={`w-full py-2 rounded-lg font-medium transition-all
//         ${loading
//                             ? "bg-indigo-400 cursor-not-allowed"
//                             : "bg-indigo-600 hover:bg-indigo-700"
//                         }`}
//                 >
//                     {loading ? "Starting Scan..." : "Start Scan"}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default NewScan;



import { useState } from "react";
import { PlusCircle, Upload, GitBranch, Link as LinkIcon, Box } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/auth";

const NewScan = () => {
    const [sourceType, setSourceType] = useState("upload"); // ✅ FIXED
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ FORM STATE (FIXED ERROR)
    const [form, setForm] = useState({
        projectName: "",
        repoUrl: "",
        imageName: "",
        link: "",
        notes: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        console.log("📂 Selected File:", selectedFile); // ✅ DEBUG

        if (!selectedFile) {
            console.log("❌ No file selected");
            return;
        }

        // Validate type (optional but good)
        console.log("📄 File Name:", selectedFile.name);
        console.log("📦 File Size:", selectedFile.size);
        console.log("🧾 File Type:", selectedFile.type);

        setFile(selectedFile);
        setFileName(selectedFile.name);

        console.log("✅ File stored in state");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        try {
            setLoading(true);

            console.log("🚀 SUBMIT START");
            console.log("Form:", form);
            console.log("SourceType:", sourceType);
            console.log("File:", file);

            const formData = new FormData();

            formData.append("projectName", form.projectName);
            formData.append("sourceType", sourceType);
            formData.append("notes", form.notes || "");

            if (sourceType === "upload" && file) {
                formData.append("file", file);
                console.log("✅ File appended to formData");
            } else {
                console.log("❌ File NOT appended");
            }

            if (sourceType === "github") {
                formData.append("repoUrl", form.repoUrl);
            }

            if (sourceType === "docker") {
                formData.append("imageName", form.imageName);
            }

            if (sourceType === "link") {
                formData.append("link", form.link);
            }

            // 🔥 IMPORTANT DEBUG
            for (let pair of formData.entries()) {
                console.log("📦 FormData →", pair[0], pair[1]);
            }

            const toastId = toast.loading("Starting scan...");

            await API.post("/scans", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success("Scan started successfully 🚀", { id: toastId });

        } catch (err) {
            console.error("❌ ERROR:", err);
            toast.error(err.response?.data?.message || "Failed to start scan ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 bg-[#0f0f1a] min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Start New Scan
            </h1>

            <form onSubmit={handleSubmit} className="max-w-3xl bg-[#13131f] p-6 rounded-2xl border border-white/10 space-y-6">

                {/* Project Name */}
                <input
                    name="projectName"
                    value={form.projectName}
                    onChange={handleChange}
                    placeholder="Project name"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10"
                />

                {/* Source Type */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { key: "upload", label: "Upload", icon: Upload },
                        { key: "github", label: "Git Repo", icon: GitBranch },
                        { key: "docker", label: "Image", icon: Box },
                        { key: "link", label: "Link", icon: LinkIcon },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            type="button"
                            key={key}
                            onClick={() => setSourceType(key)}
                            className={`p-3 rounded-lg ${sourceType === key ? "bg-indigo-600" : "bg-white/5"}`}
                        >
                            <Icon className="w-4 h-4 mx-auto" />
                            <p className="text-xs">{label}</p>
                        </button>
                    ))}
                </div>

                {/* Upload */}
                {/* {sourceType === "upload" && (
                    <input type="file" onChange={handleFileChange} />
                )} */}

                {/* Upload */}
                {sourceType === "upload" && (
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">
                            Upload SBOM / Manifest
                        </label>

                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-indigo-500 transition-all group">

                            {/* Icon */}
                            <Upload className="w-12 h-12 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />

                            {/* Text */}
                            <p className="text-sm text-slate-300">
                                <span className="text-indigo-400 font-semibold">
                                    Click to upload
                                </span>{" "}
                                or drag & drop
                            </p>

                            {/* Subtext */}
                            <p className="text-xs text-slate-500 mt-1">
                                JSON, XML, SPDX, CycloneDX (Max 5MB)
                            </p>

                            {/* Selected File */}
                            {fileName && (
                                <div className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                    📄 {fileName}
                                </div>
                            )}

                            {/* Hidden Input */}
                            <input
                                type="file"
                                name="file"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}

                {/* Git */}
                {sourceType === "github" && (
                    <input
                        name="repoUrl"
                        value={form.repoUrl}
                        onChange={handleChange}
                        placeholder="GitHub URL"
                        className="w-full px-4 py-2 bg-white/5 border rounded"
                    />
                )}

                {/* Docker */}
                {sourceType === "docker" && (
                    <input
                        name="imageName"
                        value={form.imageName}
                        onChange={handleChange}
                        placeholder="Docker image"
                        className="w-full px-4 py-2 bg-white/5 border rounded"
                    />
                )}

                {/* Link */}
                {sourceType === "link" && (
                    <input
                        name="link"
                        value={form.link}
                        onChange={handleChange}
                        placeholder="Website link"
                        className="w-full px-4 py-2 bg-white/5 border rounded"
                    />
                )}

                {/* Notes */}
                <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                    className="w-full px-4 py-2 bg-white/5 border rounded"
                />

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 py-2 rounded-lg"
                >
                    {loading ? "Starting..." : "Start Scan"}
                </button>

            </form>
        </div>
    );
};

export default NewScan;
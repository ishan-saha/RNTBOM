const { spawn } = require("child_process");
const https = require("https");
const http = require("http");
const Scan = require("../models/Scan");
const Report = require("../models/Report");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────
// Helper: run a binary, keep stdout/stderr separate
// ─────────────────────────────────────────────
const execTool = (bin, args) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(bin, args);
        const stdoutChunks = [];
        const stderrChunks = [];

        proc.stdout.on("data", (d) => stdoutChunks.push(d));
        proc.stderr.on("data", (d) => stderrChunks.push(d));

        proc.on("error", (err) => {
            // binary not found / not installed
            reject(`Cannot run "${bin}": ${err.message}. Make sure ${bin} is installed and in PATH.`);
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve(Buffer.concat(stdoutChunks).toString("utf8"));
            } else {
                const errMsg = Buffer.concat(stderrChunks).toString("utf8");
                reject(errMsg || `${bin} exited with code ${code}`);
            }
        });
    });
};

// ─────────────────────────────────────────────
// Helper: download a URL to a local file (no axios needed)
// ─────────────────────────────────────────────
const downloadFile = (url, destPath) => {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith("https") ? https : http;
        const file = fs.createWriteStream(destPath);

        proto.get(url, (res) => {
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                return reject(`HTTP ${res.statusCode} when downloading ${url}`);
            }
            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", (err) => {
            file.close();
            fs.unlink(destPath, () => {});
            reject(err.message);
        });
    });
};

// ─────────────────────────────────────────────
// Helper: safely parse JSON from tool output
// ─────────────────────────────────────────────
const safeParseJSON = (raw, toolName) => {
    // syft sometimes prints a log line before the JSON — find the first '{'
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
        throw new Error(`${toolName} output did not contain valid JSON`);
    }
    return JSON.parse(raw.slice(start, end + 1));
};

// ─────────────────────────────────────────────
// Helper: cleanup temp path (fire-and-forget)
// ─────────────────────────────────────────────
const cleanupTemp = (tempPath) => {
    if (!tempPath) return;
    try {
        if (fs.existsSync(tempPath)) {
            fs.rmSync(tempPath, { recursive: true, force: true });
            console.log("🧹 Cleaned up temp:", tempPath);
        }
    } catch (e) {
        console.warn("⚠️  Could not clean temp:", e.message);
    }
};

 
// // ─────────────────────────────────────────────
// // MAIN: runScan
// // ─────────────────────────────────────────────
// const runScan = async (scan) => {
//     let tempToClean = null;

//     try {
//         console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

//         // ✅ Step 1: initial target
//         // let target = path.resolve(scan.source);
//         let target = scan.source;

//         console.log("📍 Initial TARGET:", target);
//         console.log("📁 Exists:", fs.existsSync(target));

//         // ── GitHub: clone repo ──────────────────────────
//         if (scan.scanType === "github") {
//             const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
//             fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

//             if (!fs.existsSync(repoPath)) {
//                 console.log("📥 Cloning repo:", scan.source);
//                 await execTool("git", ["clone", "--depth", "1", scan.source, repoPath]);
//             }

//             target = repoPath;
//             tempToClean = repoPath;
//         }

//         // ── Link: download file ─────────────────────────
//         if (scan.scanType === "link") {
//             const tempDir = path.join(__dirname, "../../temp");
//             fs.mkdirSync(tempDir, { recursive: true });

//             const tempFile = path.join(tempDir, `${scan._id.toString()}-link.json`);
//             console.log("📥 Downloading link:", scan.source);
//             await downloadFile(scan.source, tempFile);

//             target = tempFile;
//             tempToClean = tempFile;
//         }

//         // ✅ Step 2: FINAL TARGET (after all modifications)
//         target = path.resolve(target);

//         console.log("✅ FINAL TARGET:", target);
//         console.log("📁 FINAL EXISTS:", fs.existsSync(target));

//         // ✅ Step 3: VALIDATION (VERY IMPORTANT)
//         if (!target || !fs.existsSync(target)) {
//             throw new Error("❌ Invalid or missing scan target: " + target);
//         }

//         // ── SBOM Handling ───────────────────────────────
//         let sbom;

//         if (scan.scanType === "upload") {
//             console.log("📂 Reading uploaded SBOM file...");

//             const raw = fs.readFileSync(target, "utf-8");
//             sbom = JSON.parse(raw);

//         } else {
//             console.log("🔍 Running syft on:", target);

//             const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
//             sbom = safeParseJSON(sbomRaw, "syft");
//         }

//         const rawComponents = sbom.components || [];
//         console.log("📦 Components found:", rawComponents.length);

//         // ── GRYPE: vulnerability scan ────────────────────
//         console.log("🛡️ Running grype on:", target);

//         const vulnRaw = await execTool("grype", [target, "-o", "json"]);
//         const vulnJson = safeParseJSON(vulnRaw, "grype");
//         const matches = vulnJson.matches || [];

//         console.log("🚨 Vulnerabilities found:", matches.length);

//         // ── Count severities ─────────────────────────────
//         let critical = 0, high = 0, medium = 0, low = 0;

//         matches.forEach((m) => {
//             const sev = (m.vulnerability?.severity || "").toLowerCase();
//             if (sev === "critical") critical++;
//             else if (sev === "high") high++;
//             else if (sev === "medium") medium++;
//             else low++;
//         });

//         console.log("📊 Severity Count:", { critical, high, medium, low });

//         // ── Map components ──────────────────────────────
//         const mappedComponents = rawComponents.map((c) => ({
//             name: c.name || "",
//             version: c.version || "",
//             type: c.type || "",
//             purl: c.purl || "",
//             licenses: (c.licenses || []).map((l) => l.expression || l.id || ""),
//             group: c.group || "",
//             scope: c.scope || "",
//         }));

//         // ── Map vulnerabilities ─────────────────────────
//         const mappedVulns = matches.map((m) => ({
//             cve: m.vulnerability?.id || "",
//             severity: (m.vulnerability?.severity || "unknown").toLowerCase(),
//             description: m.vulnerability?.description || "",
//             package: m.artifact?.name || "",
//             version: m.artifact?.version || "",
//             fixedVersion: m.vulnerability?.fix?.versions?.[0] || "",
//             reference: m.vulnerability?.dataSource || "",
//         }));

//         // ── Create Report ───────────────────────────────
//         const report = await Report.create({
//             scan: scan._id,
//             sbom,
//             components: mappedComponents,
//             vulnerabilities: mappedVulns,
//             summary: {
//                 totalComponents: rawComponents.length,
//                 totalVulnerabilities: matches.length,
//                 critical,
//                 high,
//                 medium,
//                 low,
//             },
//         });

//         // ── Update Scan ─────────────────────────────────
//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "completed",
//             componentCount: rawComponents.length,
//             vulnTotal: matches.length,
//             vulnCritical: critical,
//             vulnHigh: high,
//             vulnMedium: medium,
//             vulnLow: low,
//             completedAt: new Date(),
//             report: report._id,
//             specVersion: sbom.specVersion || sbom.version || "",
//         });

//         console.log("✅ SCAN COMPLETED:", scan._id);

//     } catch (error) {
//         console.error("❌ SCAN FAILED:", scan._id);
//         console.error("🔥 ERROR DETAILS:", error);

//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "failed",
//             errorMessage: error.toString().slice(0, 2000),
//             completedAt: new Date(),
//         });

//     } finally {
//         cleanupTemp(tempToClean);
//     }
// };

// module.exports = { runScan };



// // ─────────────────────────────────────────────
// // MAIN: runScan (FINAL VERSION)
// // ─────────────────────────────────────────────
// const runScan = async (scan) => {
//     let tempToClean = null;

//     try {
//         console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

//         // ✅ Step 1: initial target
//         // let target = scan.source;
//         let target = typeof scan.source === "string"
//     ? scan.source
//     : scan.source?.image || "";

//         console.log("📍 Initial TARGET:", target);
//         console.log("📁 Exists:", fs.existsSync(target));

//         // ── GitHub: clone repo ──────────────────────────
//         if (scan.scanType === "github") {
//             const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
//             fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

//             if (!fs.existsSync(repoPath)) {
//                 console.log("📥 Cloning repo:", scan.source);
//                 await execTool("git", ["clone", "--depth", "1", scan.source, repoPath]);
//             }

//             target = repoPath;
//             tempToClean = repoPath;
//         }

//         // ── Docker: image + optional SBOM link ───────────
// if (scan.scanType === "docker") {
//     const dockerSource = scan.source;

//     // ✅ if link exists → download SBOM
//     if (dockerSource.link) {
//         const tempDir = path.join(__dirname, "../../temp");
//         fs.mkdirSync(tempDir, { recursive: true });

//         const tempFile = path.join(tempDir, `${scan._id.toString()}-sbom.json`);

//         console.log("📥 Downloading SBOM from URL:", dockerSource.link);
//         await downloadFile(dockerSource.link, tempFile);

//         target = tempFile;
//         tempToClean = tempFile;
//     } 
//     // ✅ else use docker image
//     else {
//         console.log("🐳 Using Docker image:", dockerSource.image);
//         target = dockerSource.image;
//     }
// }

//         // ── Link: download file ─────────────────────────
//         // if (scan.scanType === "link") {
//         //     const tempDir = path.join(__dirname, "../../temp");
//         //     fs.mkdirSync(tempDir, { recursive: true });

//         //     const tempFile = path.join(tempDir, `${scan._id.toString()}-link.json`);
//         //     console.log("📥 Downloading link:", scan.source);
//         //     await downloadFile(scan.source, tempFile);

//         //     target = tempFile;
//         //     tempToClean = tempFile;
//         // }

//         // ✅ Step 2: FINAL TARGET
//         // target = path.resolve(target);
//         if (scan.scanType !== "docker") {
//     target = path.resolve(target);
// }

//         console.log("✅ FINAL TARGET:", target);
//         console.log("📁 FINAL EXISTS:", fs.existsSync(target));

//         if (!target || !fs.existsSync(target)) {
//             throw new Error("❌ Invalid or missing scan target: " + target);
//         }

//         // ── SBOM Handling ───────────────────────────────
//         let sbom;
//         let isValidSBOM = false;

//         if (scan.scanType === "upload") {
//             console.log("📂 Reading uploaded file...");

//             const raw = fs.readFileSync(target, "utf-8");
//             const json = JSON.parse(raw);

//             // ✅ CASE 1: package.json
//             if (json.dependencies) {
//                 console.log("⚡ Converting package.json → SBOM");

//                 const components = Object.entries(json.dependencies).map(([name, version]) => ({
//                     name,
//                     version,
//                     type: "library"
//                 }));

//                 sbom = {
//                     bomFormat: "CycloneDX",
//                     specVersion: "1.4",
//                     components
//                 };

//                 isValidSBOM = false; // ❌ skip grype
//             }

//             // ✅ CASE 2: CycloneDX SBOM
//             else if (json.bomFormat === "CycloneDX") {
//                 console.log("✅ Valid CycloneDX SBOM detected");

//                 sbom = json;
//                 isValidSBOM = true; // ✅ run grype
//             }

//             // ❌ invalid
//             else {
//                 throw new Error("Invalid file. Upload package.json or CycloneDX SBOM");
//             }
//         }

//         // ✅ GitHub / Docker / Link
//         else {
//             console.log("🔍 Running syft on:", target);

//             const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
//             sbom = safeParseJSON(sbomRaw, "syft");
//             isValidSBOM = true; // syft always gives valid SBOM
//         }

//         const rawComponents = sbom.components || [];
//         console.log("📦 Components found:", rawComponents.length);

//         // ── GRYPE LOGIC (SMART) ─────────────────────────
//         let matches = [];

//         // ✅ GitHub / Docker
//         if (scan.scanType !== "upload") {
//             console.log("🛡️ Running grype on:", target);

//             const vulnRaw = await execTool("grype", [target, "-o", "json"]);
//             const vulnJson = safeParseJSON(vulnRaw, "grype");
//             matches = vulnJson.matches || [];
//         }

//         // ✅ Upload + valid SBOM
//         else if (scan.scanType === "upload" && isValidSBOM) {
//             console.log("🛡️ Running grype on uploaded SBOM...");

//             const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
//             const vulnJson = safeParseJSON(vulnRaw, "grype");
//             matches = vulnJson.matches || [];
//         }

//         // ❌ Upload package.json
//         else {
//             console.log("⚠️ Skipping grype (not a valid SBOM)");
//         }

//         console.log("🚨 Vulnerabilities found:", matches.length);

//         // ── Count severities ─────────────────────────────
//         let critical = 0, high = 0, medium = 0, low = 0;

//         matches.forEach((m) => {
//             const sev = (m.vulnerability?.severity || "").toLowerCase();
//             if (sev === "critical") critical++;
//             else if (sev === "high") high++;
//             else if (sev === "medium") medium++;
//             else low++;
//         });

//         console.log("📊 Severity Count:", { critical, high, medium, low });

//         // ── Map components ──────────────────────────────
//         const mappedComponents = rawComponents.map((c) => ({
//             name: c.name || "",
//             version: c.version || "",
//             type: c.type || "",
//             purl: c.purl || "",
//             licenses: (c.licenses || []).map((l) => l.expression || l.id || ""),
//             group: c.group || "",
//             scope: c.scope || "",
//         }));

//         // ── Map vulnerabilities ─────────────────────────
//         const mappedVulns = matches.map((m) => ({
//             cve: m.vulnerability?.id || "",
//             severity: (m.vulnerability?.severity || "unknown").toLowerCase(),
//             description: m.vulnerability?.description || "",
//             package: m.artifact?.name || "",
//             version: m.artifact?.version || "",
//             fixedVersion: m.vulnerability?.fix?.versions?.[0] || "",
//             reference: m.vulnerability?.dataSource || "",
//         }));

//         // ── Create Report ───────────────────────────────
//         const report = await Report.create({
//             scan: scan._id,
//             sbom,
//             components: mappedComponents,
//             vulnerabilities: mappedVulns,
//             summary: {
//                 totalComponents: rawComponents.length,
//                 totalVulnerabilities: matches.length,
//                 critical,
//                 high,
//                 medium,
//                 low,
//             },
//         });

//         // ── Update Scan ─────────────────────────────────
//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "completed",
//             componentCount: rawComponents.length,
//             vulnTotal: matches.length,
//             vulnCritical: critical,
//             vulnHigh: high,
//             vulnMedium: medium,
//             vulnLow: low,
//             completedAt: new Date(),
//             report: report._id,
//             specVersion: sbom.specVersion || sbom.version || "",
//         });

//         console.log("✅ SCAN COMPLETED:", scan._id);

//     } catch (error) {
//         console.error("❌ SCAN FAILED:", scan._id);
//         console.error("🔥 ERROR DETAILS:", error);

//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "failed",
//             errorMessage: error.toString().slice(0, 2000),
//             completedAt: new Date(),
//         });

//     } finally {
//         cleanupTemp(tempToClean);
//     }
// };

// module.exports = { runScan };



// const runScan = async (scan) => {
//     let tempToClean = null;

//     try {
//         console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

//         let target = typeof scan.source === "string"
//             ? scan.source
//             : scan.source?.image || "";

//         // ── GitHub ─────────────────────────
//         if (scan.scanType === "github") {
//             const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
//             fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

//             if (!fs.existsSync(repoPath)) {
//                 console.log("📥 Cloning repo:", scan.source);
//                 await execTool("git", ["clone", "--depth", "1", scan.source, repoPath]);
//             }

//             target = repoPath;
//             tempToClean = repoPath;
//         }

//         // ── Docker ─────────────────────────
//         if (scan.scanType === "docker") {
//             const { image, link } = scan.source;

//             // ✅ PRIORITY → SBOM link
//             if (link) {
//                 console.log("⚡ Using SBOM link (priority)");

//                 const tempDir = path.join(__dirname, "../../temp");
//                 fs.mkdirSync(tempDir, { recursive: true });

//                 const tempFile = path.join(tempDir, `${scan._id}-sbom.json`);

//                 await downloadFile(link, tempFile);

//                 target = tempFile;
//                 tempToClean = tempFile;
//             } else {
//                 console.log("🐳 Using Docker image:", image);
//                 target = image;
//             }
//         }

//         // ✅ FIX: resolve only for file paths
//         if (scan.scanType !== "docker") {
//             target = path.resolve(target);
//         }

//         console.log("📍 FINAL TARGET:", target);

//         if (!target) throw new Error("Invalid target");

//         // ── SBOM GENERATION ─────────────────────────
//         let sbom;
//         let isValidSBOM = false;

//         if (scan.scanType === "upload") {
//             const raw = fs.readFileSync(target, "utf-8");
//             const json = JSON.parse(raw);

//             if (json.dependencies) {
//                 console.log("⚡ package.json → SBOM");

//                 sbom = {
//                     bomFormat: "CycloneDX",
//                     specVersion: "1.4",
//                     components: Object.entries(json.dependencies).map(([name, version]) => ({
//                         name,
//                         version,
//                         type: "library"
//                     }))
//                 };

//                 isValidSBOM = false;
//             } else if (json.bomFormat === "CycloneDX") {
//                 sbom = json;
//                 isValidSBOM = true;
//             } else {
//                 throw new Error("Invalid upload file");
//             }
//         } else {
//             console.log("🔍 Running syft...");
//             const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
//             sbom = safeParseJSON(sbomRaw, "syft");
//             isValidSBOM = true;
//         }

//         console.log("📦 Components:", sbom.components?.length || 0);

//         // ── GRYPE ─────────────────────────
//         let matches = [];

//         if (scan.scanType === "upload" && isValidSBOM) {
//             const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
//             matches = safeParseJSON(vulnRaw, "grype").matches || [];
//         }

//         else if (scan.scanType !== "upload") {
//             // ✅ if SBOM file
//             if (typeof target === "string" && target.endsWith(".json")) {
//                 console.log("🛡️ Grype SBOM mode");
//                 const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
//                 matches = safeParseJSON(vulnRaw, "grype").matches || [];
//             } else {
//                 console.log("🛡️ Grype image/dir mode");
//                 const vulnRaw = await execTool("grype", [target, "-o", "json"]);
//                 matches = safeParseJSON(vulnRaw, "grype").matches || [];
//             }
//         }

//         console.log("🚨 Vulnerabilities:", matches.length);

//         // ── SAVE REPORT ─────────────────────────
//         const report = await Report.create({
//             scan: scan._id,
//             sbom,
//             components: sbom.components || [],
//             vulnerabilities: matches,
//             summary: {
//                 totalComponents: sbom.components?.length || 0,
//                 totalVulnerabilities: matches.length
//             }
//         });

//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "completed",
//             componentCount: sbom.components?.length || 0,
//             vulnTotal: matches.length,
//             completedAt: new Date(),
//             report: report._id
//         });

//         console.log("✅ SCAN COMPLETED");

//     } catch (err) {
//         console.error("❌ SCAN FAILED:", err);

//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "failed",
//             errorMessage: err.toString()
//         });

//     } finally {
//         cleanupTemp(tempToClean);
//     }
// };

// module.exports = { runScan };



// const runScan = async (scan) => {
//     let tempToClean = null;

//     try {
//         console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

//         // let target = typeof scan.source === "string"
//         //     ? scan.source
//         //     : scan.source?.image || "";

//         let target = "";

// // upload
// if (scan.scanType === "upload") {
//     target = scan.source.filePath;
// }

// // github
// else if (scan.scanType === "github") {
//     target = scan.source.repoUrl;
// }

// // docker
// else if (scan.scanType === "docker") {
//     target = scan.source.image || "";
// }

//         // ─────────────────────────────────────
//         // 📥 GITHUB
//         // ─────────────────────────────────────
//         if (scan.scanType === "github") {
//             const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
//             fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

//             if (!fs.existsSync(repoPath)) {
//                 console.log("📥 Cloning repo:", scan.source);
//                 await execTool("git", ["clone", "--depth", "1", scan.source, repoPath]);
//             }

//             target = repoPath;
//             tempToClean = repoPath;
//         }

//         // ─────────────────────────────────────
//         // 🐳 DOCKER (FIXED LOGIC)
//         // ─────────────────────────────────────
//         if (scan.scanType === "docker") {
//             const { image, link } = scan.source || {};

//             if (link) {
//                 console.log("⚡ Using SBOM link (priority)");

//                 const tempDir = path.join(__dirname, "../../temp");
//                 fs.mkdirSync(tempDir, { recursive: true });

//                 const tempFile = path.join(tempDir, `${scan._id}-sbom.json`);
//                 await downloadFile(link, tempFile);

//                 target = tempFile;
//                 tempToClean = tempFile;
//             } else if (image) {
//                 console.log("🐳 Using Docker image:", image);
//                 target = image;
//             } else {
//                 throw new Error("Docker scan requires image or link");
//             }
//         }

//         // ─────────────────────────────────────
//         // 📁 RESOLVE PATH
//         // ─────────────────────────────────────
//         if (scan.scanType !== "docker") {
//             target = path.resolve(target);
//         }

//         console.log("📍 FINAL TARGET:", target);

//         if (!target) throw new Error("Invalid target");

//         // ─────────────────────────────────────
//         // 📦 SBOM GENERATION
//         // ─────────────────────────────────────
//         let sbom;
//         let isValidSBOM = false;

//         if (scan.scanType === "upload") {
//             console.log("📂 Reading uploaded file...");

//             const raw = fs.readFileSync(target, "utf-8");
//             const json = JSON.parse(raw);

//             // ✅ package.json
//             if (json.dependencies) {
//                 console.log("⚡ package.json → SBOM");

//                 sbom = {
//                     bomFormat: "CycloneDX",
//                     specVersion: "1.4",
//                     components: Object.entries(json.dependencies).map(([name, version]) => ({
//                         name,
//                         version,
//                         type: "library"
//                     }))
//                 };

//                 isValidSBOM = false;
//             }

//             // ✅ CycloneDX
//             else if (json.bomFormat === "CycloneDX") {
//                 console.log("✅ Valid SBOM detected");
//                 sbom = json;
//                 isValidSBOM = true;
//             }

//             else {
//                 throw new Error("Invalid upload file");
//             }
//         }

//         // ✅ GitHub / Docker
//         else {
//             console.log("🔍 Running syft...");
//             const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
//             sbom = safeParseJSON(sbomRaw, "syft");
//             isValidSBOM = true;
//         }

//         const rawComponents = sbom.components || [];
//         console.log("📦 Components:", rawComponents.length);

//         // ─────────────────────────────────────
//         // 🛡️ GRYPE
//         // ─────────────────────────────────────
//         let matches = [];

//         if (scan.scanType === "upload" && isValidSBOM) {
//             console.log("🛡️ Grype SBOM upload");

//             const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
//             matches = safeParseJSON(vulnRaw, "grype").matches || [];
//         }

//         else if (scan.scanType !== "upload") {
//             if (typeof target === "string" && target.endsWith(".json")) {
//                 console.log("🛡️ Grype SBOM file");
//                 const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
//                 matches = safeParseJSON(vulnRaw, "grype").matches || [];
//             } else {
//                 console.log("🛡️ Grype image/dir");
//                 const vulnRaw = await execTool("grype", [target, "-o", "json"]);
//                 matches = safeParseJSON(vulnRaw, "grype").matches || [];
//             }
//         }

//         console.log("🚨 Vulnerabilities:", matches.length);

//         // ─────────────────────────────────────
//         // 🔥 FIX: LICENSE PARSING (VERY IMPORTANT)
//         // ─────────────────────────────────────
//         const mappedComponents = rawComponents.map((c) => {

//             let licensesRaw = c.licenses || [];

//             if (typeof licensesRaw === "string") {
//                 try {
//                     licensesRaw = JSON.parse(licensesRaw);
//                 } catch {
//                     licensesRaw = [];
//                 }
//             }

//             return {
//                 name: c.name || "",
//                 version: c.version || "",
//                 type: c.type || "",
//                 purl: c.purl || "",

//                 // ✅ FIXED LICENSE
//                 licenses: licensesRaw.map((l) => {
//                     if (l.license?.id) return l.license.id;
//                     if (l.license?.name) return l.license.name;
//                     if (l.expression) return l.expression;
//                     return "";
//                 }),

//                 group: c.group || "",
//                 scope: c.scope || "",
//             };
//         });

//         // ─────────────────────────────────────
//         // 🧠 MAP VULNERABILITIES
//         // ─────────────────────────────────────
//         const mappedVulns = matches.map((m) => ({
//             cve: m.vulnerability?.id || "",
//             severity: (m.vulnerability?.severity || "unknown").toLowerCase(),
//             description: m.vulnerability?.description || "",
//             package: m.artifact?.name || "",
//             version: m.artifact?.version || "",
//             fixedVersion: m.vulnerability?.fix?.versions?.[0] || "",
//             reference: m.vulnerability?.dataSource || "",
//         }));

//         // ─────────────────────────────────────
//         // 📊 SUMMARY
//         // ─────────────────────────────────────
//         let critical = 0, high = 0, medium = 0, low = 0;

//         mappedVulns.forEach(v => {
//             if (v.severity === "critical") critical++;
//             else if (v.severity === "high") high++;
//             else if (v.severity === "medium") medium++;
//             else low++;
//         });

//         // ─────────────────────────────────────
//         // 💾 SAVE REPORT
//         // ─────────────────────────────────────
//         const report = await Report.create({
//             scan: scan._id,
//             sbom,
//             components: mappedComponents,
//             vulnerabilities: mappedVulns,
//             summary: {
//                 totalComponents: rawComponents.length,
//                 totalVulnerabilities: mappedVulns.length,
//                 critical,
//                 high,
//                 medium,
//                 low
//             }
//         });

//         // ─────────────────────────────────────
//         // 🔄 UPDATE SCAN
//         // ─────────────────────────────────────
//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "completed",
//             componentCount: rawComponents.length,
//             vulnTotal: mappedVulns.length,
//             vulnCritical: critical,
//             vulnHigh: high,
//             vulnMedium: medium,
//             vulnLow: low,
//             completedAt: new Date(),
//             report: report._id,
//             specVersion: sbom.specVersion || sbom.version || "",
//         });

//         console.log("✅ SCAN COMPLETED");

//     } catch (err) {
//         console.error("❌ SCAN FAILED:", err);

//         await Scan.findByIdAndUpdate(scan._id, {
//             status: "failed",
//             errorMessage: err.toString()
//         });

//     } finally {
//         cleanupTemp(tempToClean);
//     }
// };

// module.exports = { runScan };


// ─────────────────────────────────────────────────────────────────────────────
//  Ecosystem detection + Python manifest parsers
//  (fallback when syft finds 0 components in Python/other repos)
// ─────────────────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
    'node_modules', '.git', 'venv', '.venv', '__pycache__',
    'dist', 'build', '.tox', '.eggs', '.pytest_cache', '.mypy_cache',
]);

/** Recursively search repoPath for filename (depth-limited, skips non-source dirs) */
const findFileRecursive = (dir, filename, maxDepth = 6, _depth = 0) => {
    if (_depth > maxDepth) return null;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            if (e.isFile() && e.name === filename) return path.join(dir, e.name);
        }
        for (const e of entries) {
            if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
                const found = findFileRecursive(path.join(dir, e.name), filename, maxDepth, _depth + 1);
                if (found) return found;
            }
        }
    } catch { /* ignore permission errors */ }
    return null;
};

/** Identify the primary package ecosystem by checking for known manifest files */
const detectEcosystem = (repoPath) => {
    const checks = [
        { eco: 'python', files: ['requirements.txt', 'requirements-dev.txt', 'Pipfile', 'Pipfile.lock', 'pyproject.toml', 'setup.py', 'setup.cfg', 'poetry.lock'] },
        { eco: 'node',   files: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'] },
        { eco: 'go',     files: ['go.mod'] },
        { eco: 'java',   files: ['pom.xml', 'build.gradle', 'build.gradle.kts'] },
        { eco: 'rust',   files: ['Cargo.toml'] },
        { eco: 'ruby',   files: ['Gemfile', 'Gemfile.lock'] },
        { eco: 'php',    files: ['composer.json', 'composer.lock'] },
    ];
    for (const { eco, files } of checks) {
        for (const f of files) {
            if (findFileRecursive(repoPath, f, 4)) return eco;
        }
    }
    return 'unknown';
};

/**
 * Parse requirements.txt (and variants) → CycloneDX component objects
 * Handles: name==ver, name>=ver, name (no version), extras [sec], env markers (;)
 */
const parseRequirementsTxt = (filePath) => {
    const components = [];
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (let raw of lines) {
        let line = raw.split('#')[0].trim();           // strip inline comments
        line = line.split(';')[0].trim();              // strip env markers
        line = line.replace(/\[.*?\]/g, '').trim();    // strip extras
        if (!line || line.startsWith('-') || line.startsWith('http')) continue;

        const m = line.match(/^([A-Za-z0-9_\-\.]+)\s*(?:[><!~]=?=?|===?)\s*([^\s,]+)?/);
        const name    = m ? m[1].trim() : line.trim();
        const version = m ? (m[2] || '').replace(/[><=!~]/g, '').trim() : '';
        if (!name) continue;

        components.push({
            name,
            version,
            type:     'library',
            purl:     `pkg:pypi/${encodeURIComponent(name.toLowerCase())}${version ? '@' + version : ''}`,
            group:    '',
            scope:    'required',
            licenses: [],
        });
    }
    return components;
};

/**
 * Parse Pipfile [packages] / [dev-packages] sections (TOML-like)
 */
const parsePipfile = (filePath) => {
    const components = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    let inSection = false;
    for (const raw of content.split('\n')) {
        const line = raw.trim();
        if (line === '[packages]' || line === '[dev-packages]') { inSection = true; continue; }
        if (line.startsWith('[') && line.endsWith(']'))         { inSection = false; continue; }
        if (!inSection || !line || line.startsWith('#') || !line.includes('=')) continue;

        const eqIdx = line.indexOf('=');
        const name   = line.slice(0, eqIdx).trim();
        const rawVer = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!name || name === 'python') continue;
        const version = rawVer === '*' ? '' : rawVer.replace(/[><=!~^*"'\s]/g, '');

        components.push({
            name,
            version,
            type:     'library',
            purl:     `pkg:pypi/${encodeURIComponent(name.toLowerCase())}${version ? '@' + version : ''}`,
            group:    '',
            scope:    'required',
            licenses: [],
        });
    }
    return components;
};

/**
 * Parse pyproject.toml — supports both:
 *   [tool.poetry.dependencies] (poetry)
 *   [project] dependencies = [...] (PEP 517 / setuptools)
 */
const parsePyprojectToml = (filePath) => {
    const components = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    let inPoetryDeps = false;
    let inProjectSection = false;

    for (const raw of content.split('\n')) {
        const line = raw.trim();

        if (line === '[tool.poetry.dependencies]') { inPoetryDeps = true; inProjectSection = false; continue; }
        if (line === '[project]')                  { inProjectSection = true; inPoetryDeps = false; continue; }
        if (line.startsWith('[') && line.endsWith(']') && line !== '[tool.poetry.dependencies]' && line !== '[project]') {
            inPoetryDeps = false; inProjectSection = false; continue;
        }

        // Poetry: name = "^version"
        if (inPoetryDeps && line.includes('=') && !line.startsWith('#')) {
            const [namePart, verPart] = line.split('=').map(s => s.trim());
            const name = namePart;
            if (!name || name === 'python' || name === 'requires-python') continue;
            const version = (verPart || '').replace(/["'{}^~>=<!,\s]/g, '').split(',')[0] || '';
            components.push({
                name, version, type: 'library',
                purl: `pkg:pypi/${encodeURIComponent(name.toLowerCase())}${version ? '@' + version : ''}`,
                group: '', scope: 'required', licenses: [],
            });
        }

        // PEP 517: dependencies = ["requests>=2.0", ...]
        if (inProjectSection && line.startsWith('dependencies')) {
            // Grab all quoted package strings on subsequent lines until ]
            const depsBlock = content.slice(content.indexOf(line));
            const matches = [...depsBlock.matchAll(/"([A-Za-z0-9_\-\.]+)\s*([><!~]=?=?\s*[^\s"]+)?"/g)];
            for (const m of matches) {
                const name    = m[1];
                const version = (m[2] || '').replace(/[><=!~ ]/g, '');
                if (!name || name === 'python') continue;
                components.push({
                    name, version, type: 'library',
                    purl: `pkg:pypi/${encodeURIComponent(name.toLowerCase())}${version ? '@' + version : ''}`,
                    group: '', scope: 'required', licenses: [],
                });
            }
            break; // no need to continue after extracting deps block
        }
    }
    return components;
};

/** Wrap components in a minimal CycloneDX 1.4 SBOM envelope */
const buildCycloneDXSBOM = (components) => ({
    bomFormat:   'CycloneDX',
    specVersion: '1.4',
    version:     1,
    components,
});

/** Write SBOM JSON to a temp file; returns the file path */
const writeTempSBOM = (scanId, sbomObj) => {
    const tempDir = path.join(__dirname, '../../temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const outPath = path.join(tempDir, `${scanId}-sbom.json`);
    fs.writeFileSync(outPath, JSON.stringify(sbomObj, null, 2), 'utf-8');
    return outPath;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN: runScan
// ─────────────────────────────────────────────────────────────────────────────
const runScan = async (scan) => {
    let tempToClean    = null;
    let tempSBOMFile   = null;   // set when we write a fallback SBOM to disk

    try {
        console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

        let target = "";

        // ─────────────────────────────
        // 🎯 STEP 1: SET INITIAL TARGET
        // scan.source is always an object: { filePath?, repoUrl?, image?, link? }
        // ─────────────────────────────
        if (scan.scanType === "upload") {
            target = scan.source?.filePath || "";
        }

        else if (scan.scanType === "github") {
            target = scan.source?.repoUrl || "";
        }

        else if (scan.scanType === "docker") {
            target = scan.source?.image || "";
        }

        console.log("📍 Initial TARGET:", target);

        // ─────────────────────────────
        // 📥 STEP 2: GITHUB CLONE
        // ─────────────────────────────
        if (scan.scanType === "github") {
            if (!target) throw new Error("GitHub repo URL is missing from scan source");

            const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
            fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

            if (!fs.existsSync(repoPath)) {
                console.log("📥 Cloning repo:", target);

                await execTool("git", [
                    "clone",
                    "--depth",
                    "1",
                    target,
                    repoPath
                ]);
            }

            target = repoPath;
            tempToClean = repoPath;
        }

        // ─────────────────────────────
        // 🐳 STEP 3: DOCKER HANDLING
        // ─────────────────────────────
        if (scan.scanType === "docker") {

            const { image, link } = scan.source || {};

            // ✅ Priority → SBOM link
            if (link) {
                console.log("📥 Downloading SBOM from link:", link);

                const tempDir = path.join(__dirname, "../../temp");
                fs.mkdirSync(tempDir, { recursive: true });

                const tempFile = path.join(tempDir, `${scan._id}-sbom.json`);

                await downloadFile(link, tempFile);

                target = tempFile;
                tempToClean = tempFile;
            }

            // ✅ Else → use image
            else if (image) {
                console.log("🐳 Using Docker image:", image);
                target = image;
            }

            else {
                throw new Error("Docker scan requires image or link");
            }
        }

        // ─────────────────────────────
        // 📁 STEP 4: PATH RESOLVE
        // ─────────────────────────────
        if (scan.scanType !== "docker") {
            target = path.resolve(target);
        }

        console.log("✅ FINAL TARGET:", target);

        // ❗ Important validation
        if (!target) {
            throw new Error("Invalid target");
        }

        if (scan.scanType !== "docker" && !fs.existsSync(target)) {
            throw new Error("Target file/folder not found: " + target);
        }

        // ─────────────────────────────
        // 📦 STEP 5: SBOM GENERATION
        // ─────────────────────────────
        let sbom;
        let isValidSBOM = false;

        if (scan.scanType === "upload") {
            console.log("📂 Reading uploaded file...");

            const raw = fs.readFileSync(target, "utf-8");
            const json = JSON.parse(raw);

            // ✅ package.json
            if (json.dependencies) {
                console.log("⚡ package.json → SBOM");

                sbom = {
                    bomFormat: "CycloneDX",
                    specVersion: "1.4",
                    components: Object.entries(json.dependencies).map(([name, version]) => ({
                        name,
                        version,
                        type: "library"
                    }))
                };

                isValidSBOM = false;
            }

            // ✅ CycloneDX
            else if (json.bomFormat === "CycloneDX") {
                console.log("✅ Valid SBOM detected");

                sbom = json;
                isValidSBOM = true;
            }

            else {
                throw new Error("Invalid upload file");
            }
        }

        // ✅ GitHub / Docker — run syft; if it returns 0 components, use
        //    ecosystem-specific manifest parsing as a fallback.
        else {
            console.log("🔍 Running syft on:", target);

            try {
                const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
                sbom = safeParseJSON(sbomRaw, "syft");
            } catch (syftErr) {
                console.warn("⚠️ syft failed:", String(syftErr).slice(0, 200));
                sbom = null;
            }

            // ── Python / ecosystem fallback ───────────────────────────────
            if (!sbom || !sbom.components || sbom.components.length === 0) {
                console.log("⚠️ syft returned 0 components — trying manifest fallback...");

                const ecosystem = detectEcosystem(target);
                console.log("🔍 Detected ecosystem:", ecosystem);

                if (ecosystem === 'python') {
                    let pyComponents = [];

                    // 1. requirements.txt (most common)
                    const reqFile = findFileRecursive(target, 'requirements.txt')
                                 || findFileRecursive(target, 'requirements-dev.txt')
                                 || findFileRecursive(target, 'requirements_dev.txt');
                    if (reqFile) {
                        console.log("🐍 Parsing requirements.txt:", reqFile);
                        pyComponents = parseRequirementsTxt(reqFile);
                    }

                    // 2. Pipfile
                    if (pyComponents.length === 0) {
                        const pipfile = findFileRecursive(target, 'Pipfile');
                        if (pipfile) {
                            console.log("🐍 Parsing Pipfile:", pipfile);
                            pyComponents = parsePipfile(pipfile);
                        }
                    }

                    // 3. pyproject.toml (poetry / PEP 517)
                    if (pyComponents.length === 0) {
                        const toml = findFileRecursive(target, 'pyproject.toml');
                        if (toml) {
                            console.log("🐍 Parsing pyproject.toml:", toml);
                            pyComponents = parsePyprojectToml(toml);
                        }
                    }

                    if (pyComponents.length > 0) {
                        console.log(`✅ Python fallback: ${pyComponents.length} components parsed`);
                        sbom = buildCycloneDXSBOM(pyComponents);
                        // Write to disk so grype can consume it via sbom: prefix
                        tempSBOMFile = writeTempSBOM(scan._id.toString(), sbom);
                    } else {
                        throw new Error(
                            "No supported Python dependency manifest found. " +
                            "Expected: requirements.txt, Pipfile, or pyproject.toml"
                        );
                    }

                } else if (ecosystem === 'unknown') {
                    throw new Error(
                        "No supported dependency manifest detected. " +
                        "Supported: requirements.txt, package.json, go.mod, pom.xml, Cargo.toml, Gemfile, composer.json"
                    );
                } else {
                    // syft should handle non-Python ecosystems — re-throw as informational
                    throw new Error(
                        `SBOM generation returned no components for ${ecosystem} project. ` +
                        "Ensure the repository includes a valid dependency manifest."
                    );
                }
            }

            isValidSBOM = true;
        }

        const rawComponents = sbom.components || [];
        console.log("📦 Components found:", rawComponents.length);

        // ─────────────────────────────
        // 🛡️ STEP 6: GRYPE
        // ─────────────────────────────
        let matches = [];

        // upload + valid SBOM
        if (scan.scanType === "upload" && isValidSBOM) {
            console.log("🛡️ Running grype on uploaded SBOM");

            const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
            matches = safeParseJSON(vulnRaw, "grype").matches || [];
        }

        // docker/github
        else if (scan.scanType !== "upload") {

            // If Python fallback wrote a SBOM file, use it directly
            const grypeTarget = tempSBOMFile || target;
            const useSBOMMode = tempSBOMFile ||
                (typeof grypeTarget === "string" && grypeTarget.endsWith(".json"));

            if (useSBOMMode) {
                console.log("🛡️ Grype SBOM file mode:", grypeTarget);
                const vulnRaw = await execTool("grype", [`sbom:${grypeTarget}`, "-o", "json"]);
                matches = safeParseJSON(vulnRaw, "grype").matches || [];
            } else {
                console.log("🛡️ Grype image/dir mode:", grypeTarget);
                const vulnRaw = await execTool("grype", [grypeTarget, "-o", "json"]);
                matches = safeParseJSON(vulnRaw, "grype").matches || [];
            }
        }

        console.log("🚨 Vulnerabilities found:", matches.length);

        // ─────────────────────────────
        // 🔥 STEP 7: LICENSE FIX
        // ─────────────────────────────
        const mappedComponents = rawComponents.map((c) => {

            let licensesRaw = c.licenses || [];

            if (typeof licensesRaw === "string") {
                try {
                    licensesRaw = JSON.parse(licensesRaw);
                } catch {
                    licensesRaw = [];
                }
            }

            return {
                name: c.name || "",
                version: c.version || "",
                type: c.type || "",
                purl: c.purl || "",

                licenses: licensesRaw.map((l) => {
                    if (l.license?.id) return l.license.id;
                    if (l.license?.name) return l.license.name;
                    if (l.expression) return l.expression;
                    return "";
                }),

                group: c.group || "",
                scope: c.scope || "",
            };
        });

        // ─────────────────────────────
        // 🧠 STEP 8: VULN MAPPING
        // ─────────────────────────────
        const normalizeSeverity = (sev) => {
    if (!sev) return "low";

    sev = sev.toLowerCase();

    if (sev === "critical") return "critical";
    if (sev === "high") return "high";
    if (sev === "medium") return "medium";
    if (sev === "low") return "low";

    // fix extra values from grype
    if (sev === "negligible") return "low";
    if (sev === "unknown") return "low";

    return "low";
};
        // const mappedVulns = matches.map((m) => ({
        //     cve: m.vulnerability?.id || "",
        //     severity: (m.vulnerability?.severity || "unknown").toLowerCase(),
        //     description: m.vulnerability?.description || "",
        //     package: m.artifact?.name || "",
        //     version: m.artifact?.version || "",
        //     fixedVersion: m.vulnerability?.fix?.versions?.[0] || "",
        //     reference: m.vulnerability?.dataSource || "",
        // }));

        const mappedVulns = matches.map((m) => ({
    cve: m.vulnerability?.id || "",

    severity: normalizeSeverity(m.vulnerability?.severity), // ✅ FIXED

    description: m.vulnerability?.description || "",
    package: m.artifact?.name || "",
    version: m.artifact?.version || "",
    fixedVersion: m.vulnerability?.fix?.versions?.[0] || "",
    reference: m.vulnerability?.dataSource || "",
}));

        // ─────────────────────────────
        // 📊 STEP 9: SUMMARY
        // ─────────────────────────────
        let critical = 0, high = 0, medium = 0, low = 0;

        mappedVulns.forEach(v => {
            if (v.severity === "critical") critical++;
            else if (v.severity === "high") high++;
            else if (v.severity === "medium") medium++;
            else low++;
        });

        console.log("📊 Severity:", { critical, high, medium, low });

        // ─────────────────────────────
        // 💾 STEP 10: SAVE REPORT
        // ─────────────────────────────
        const report = await Report.create({
            scan: scan._id,
            sbom,
            components: mappedComponents,
            vulnerabilities: mappedVulns,
            summary: {
                totalComponents: rawComponents.length,
                totalVulnerabilities: mappedVulns.length,
                critical,
                high,
                medium,
                low
            }
        });

        // ─────────────────────────────
        // 🔄 STEP 11: UPDATE SCAN
        // ─────────────────────────────
        await Scan.findByIdAndUpdate(scan._id, {
            status: "completed",
            componentCount: rawComponents.length,
            vulnTotal: mappedVulns.length,
            vulnCritical: critical,
            vulnHigh: high,
            vulnMedium: medium,
            vulnLow: low,
            completedAt: new Date(),
            report: report._id,
            specVersion: sbom.specVersion || sbom.version || "",
        });

        console.log("✅ SCAN COMPLETED:", scan._id);

    } catch (err) {
        console.error("❌ SCAN FAILED:", scan._id);
        console.error("🔥 ERROR:", err);

        await Scan.findByIdAndUpdate(scan._id, {
            status: "failed",
            errorMessage: err.toString().slice(0, 2000),
            completedAt: new Date(),
        });

    } finally {
        cleanupTemp(tempToClean);
        cleanupTemp(tempSBOMFile);
    }
};

module.exports = { runScan };
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


const runScan = async (scan) => {
    let tempToClean = null;

    try {
        console.log("🚀 START SCAN:", scan._id, "| type:", scan.scanType);

        let target = "";

        // ─────────────────────────────
        // 🎯 STEP 1: SET INITIAL TARGET
        // ─────────────────────────────
        if (scan.scanType === "upload") {
            target = scan.source.filePath;
        }

        else if (scan.scanType === "github") {
            target = scan.source.repoUrl;
        }

        else if (scan.scanType === "docker") {
            target = scan.source.image || "";
        }

        console.log("📍 Initial TARGET:", target);

        // ─────────────────────────────
        // 📥 STEP 2: GITHUB CLONE
        // ─────────────────────────────
        if (scan.scanType === "github") {
            const repoPath = path.join(__dirname, "../../temp", scan._id.toString());
            fs.mkdirSync(path.join(__dirname, "../../temp"), { recursive: true });

            if (!fs.existsSync(repoPath)) {
                console.log("📥 Cloning repo:", scan.source.repoUrl);

                await execTool("git", [
                    "clone",
                    "--depth",
                    "1",
                    scan.source.repoUrl,
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

        // ✅ GitHub / Docker
        else {
            console.log("🔍 Running syft on:", target);

            const sbomRaw = await execTool("syft", [target, "-o", "cyclonedx-json"]);
            sbom = safeParseJSON(sbomRaw, "syft");

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

            if (typeof target === "string" && target.endsWith(".json")) {
                console.log("🛡️ Grype SBOM file mode");

                const vulnRaw = await execTool("grype", [`sbom:${target}`, "-o", "json"]);
                matches = safeParseJSON(vulnRaw, "grype").matches || [];
            }

            else {
                console.log("🛡️ Grype image/dir mode");

                const vulnRaw = await execTool("grype", [target, "-o", "json"]);
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
    }
};

module.exports = { runScan };
const { exec } = require("child_process");
const Scan = require("../models/Scan");
const path = require("path");
const fs = require("fs");

// 🔧 helper
const execPromise = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) {
                console.error("CMD ERROR:", stderr);
                return reject(stderr || err.message);
            }
            resolve(stdout);
        });
    });
};

const runScan = async (scan) => {
    try {
        console.log("🚀 START SCAN:", scan._id);

        let target = scan.source;

        // =========================
        // 🐙 GitHub clone
        // =========================
        if (scan.scanType === "github") {
            const repoPath = path.join(__dirname, "../../temp", scan._id.toString());

            if (!fs.existsSync(repoPath)) {
                await execPromise(`git clone ${scan.source} ${repoPath}`);
            }

            target = repoPath;
        }

        // =========================
        // 🧪 SBOM (SYFT)
        // =========================
        const sbomRaw = await execPromise(`syft ${target} -o cyclonedx-json`);
        const sbom = JSON.parse(sbomRaw);

        const components = sbom.components || [];

        // =========================
        // 🔍 VULNERABILITY (GRYPE)
        // =========================
        const vulnRaw = await execPromise(`grype ${target} -o json`);
        const vulnJson = JSON.parse(vulnRaw);

        const matches = vulnJson.matches || [];

        // =========================
        // 📊 COUNT SEVERITY
        // =========================
        let critical = 0, high = 0, medium = 0, low = 0;

        matches.forEach(v => {
            const sev = v.vulnerability?.severity?.toLowerCase();

            if (sev === "critical") critical++;
            else if (sev === "high") high++;
            else if (sev === "medium") medium++;
            else low++;
        });

        // =========================
        // 💾 UPDATE SCAN
        // =========================
        await Scan.findByIdAndUpdate(scan._id, {
            status: "completed",
            componentCount: components.length,

            vulnTotal: matches.length,
            vulnCritical: critical,
            vulnHigh: high,
            vulnMedium: medium,
            vulnLow: low,

            completedAt: new Date(),
        });

        console.log("✅ SCAN COMPLETED:", scan._id);

    } catch (error) {
        console.error("❌ SCAN FAILED:", error);

        await Scan.findByIdAndUpdate(scan._id, {
            status: "failed",
            errorMessage: error.toString(),
            completedAt: new Date(),
        });
    }
};

module.exports = { runScan };
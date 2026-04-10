const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
    {
        // 🔗 Link to Scan
        scan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Scan',
            required: true,
            index: true,
        },

        // 📦 Raw SBOM (CycloneDX JSON)
        sbom: {
            type: Object,
        },

        // 📚 Components (LIB)
        components: [
            {
                name: { type: String, required: true },
                version: { type: String },
                type: { type: String }, // library, framework, etc
                purl: { type: String },
                licenses: [{ type: String }],
                group: { type: String },
                scope: { type: String },
            },
        ],

        // 🚨 Vulnerabilities (CVE)
        vulnerabilities: [
            {
                cve: { type: String, index: true },
                severity: {
                    type: String,
                    enum: ['critical', 'high', 'medium', 'low', 'unknown'],
                    default: 'unknown',
                },
                description: { type: String },
                package: { type: String },
                version: { type: String },
                fixedVersion: { type: String },
                reference: { type: String }, // link to CVE
            },
        ],

        // 📊 Summary (for dashboard)
        summary: {
            totalComponents: { type: Number, default: 0 },

            totalVulnerabilities: { type: Number, default: 0 },
            critical: { type: Number, default: 0 },
            high: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            low: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
    }
);


// 🚀 Indexes (important for queries)
ReportSchema.index({ 'vulnerabilities.cve': 1 });
ReportSchema.index({ scan: 1 });


// 🔥 Virtual: severity score (optional advanced)
ReportSchema.virtual('riskScore').get(function () {
    return (
        (this.summary.critical || 0) * 5 +
        (this.summary.high || 0) * 3 +
        (this.summary.medium || 0) * 2 +
        (this.summary.low || 0)
    );
});


ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Report', ReportSchema);
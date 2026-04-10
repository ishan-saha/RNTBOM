const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema(
    {
        // 🏢 Organization
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        notes: {
            type: String,
            default: '',
        },

        // 👤 Who uploaded / started scan
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 📄 File / project name
        filename: {
            type: String,
            required: true,
            trim: true,
        },

        // 📦 SBOM format
        format: {
            type: String,
            enum: ['cyclonedx', 'spdx'],
            default: 'cyclonedx',
        },

        specVersion: {
            type: String,
            default: '',
        },

        componentCount: {
            type: Number,
            default: 0,
        },

        // 🔍 Scan type
        scanType: {
            type: String,
            enum: ['upload', 'github', 'docker', 'link'],
            required: true,
        },

        // 🌐 Source (repo URL / image / file path)
        source: {
            type: String,
            default: '',
        },

        // ⚡ Status
        status: {
            type: String,
            enum: ['pending', 'running', 'completed', 'failed'],
            default: 'pending',
            index: true,
        },

        errorMessage: {
            type: String,
        },

        // ⏱ Time tracking
        startedAt: Date,
        completedAt: Date,

        // 🔥 Vulnerability Summary (VERY IMPORTANT)
        vulnTotal: { type: Number, default: 0 },
        vulnCritical: { type: Number, default: 0 },
        vulnHigh: { type: Number, default: 0 },
        vulnMedium: { type: Number, default: 0 },
        vulnLow: { type: Number, default: 0 },

        // 📊 Link to Report
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report',
        },
    },
    {
        timestamps: true,
    }
);


// 🚀 Indexes (important for dashboard queries)
ScanSchema.index({ organization: 1, status: 1 });
ScanSchema.index({ uploadedBy: 1 });
ScanSchema.index({ createdAt: -1 });


// 🔥 Virtual: duration (auto calculate)
ScanSchema.virtual('duration').get(function () {
    if (this.startedAt && this.completedAt) {
        return (this.completedAt - this.startedAt) / 1000; // seconds
    }
    return null;
});


// Enable virtuals
ScanSchema.set('toJSON', { virtuals: true });
ScanSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Scan', ScanSchema);
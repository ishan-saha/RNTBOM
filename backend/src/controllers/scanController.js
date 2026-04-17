const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const Report = require('../models/Report');
const { runScan } = require('../services/scanService');
const {
    getOrgId,
    buildReadScanFilter,
    buildOrgScanFilter,
} = require('../utils/scanAccess');

const detectFormatFromFile = (file) => {
    if (!file) return 'cyclonedx';
    const name = file.originalname.toLowerCase();
    if (name.includes('spdx') || name.endsWith('.spdx') || name.endsWith('.spdx.json')) return 'spdx';
    return 'cyclonedx';
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
const createScan = async (req, res) => {
    try {
        const projectName    = req.body.projectName;
        const sourceTypeRaw  = req.body.sourceType;
        const repoUrl        = req.body.repoUrl;
        const imageName      = req.body.imageName;
        const link           = req.body.link;
        const notes          = req.body.notes;

        const sourceType = sourceTypeRaw?.toString().trim().toLowerCase();
        const allowedSourceTypes = ['upload', 'github', 'docker'];

        const organizationId = getOrgId(req.user);

        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'User organization not found.' });
        }
        if (!projectName?.trim()) {
            return res.status(400).json({ success: false, message: 'Project name is required.' });
        }
        if (!sourceType || !allowedSourceTypes.includes(sourceType)) {
            return res.status(400).json({ success: false, message: 'Invalid scan source type.' });
        }

        // let sourceValue = '';
        let sourceValue = null;
        let format = 'cyclonedx';

        if (sourceType === 'upload') {
            if (!req.file) return res.status(400).json({ success: false, message: 'File not received. Please upload again.' });
            sourceValue = { filePath: req.file.path };
            format = detectFormatFromFile(req.file);
        }
        if (sourceType === 'github') {
            if (!repoUrl?.trim()) return res.status(400).json({ success: false, message: 'Git repository URL is required.' });
            sourceValue = { repoUrl: repoUrl.trim() };
        }
        // if (sourceType === 'docker') {
        //     if (!imageName?.trim()) return res.status(400).json({ success: false, message: 'Docker image name is required.' });
        //     sourceValue = imageName.trim();
        // }
         
        if (sourceType === 'docker') {
    if (!imageName?.trim()) {
        return res.status(400).json({ success: false, message: 'Docker image name is required.' });
    }

    // ✅ store both image + optional link
    sourceValue = {
        image: imageName.trim(),
        link: link?.trim() || null
    };
}

        // if (sourceType === 'link') {
        //     if (!link?.trim()) return res.status(400).json({ success: false, message: 'Link is required.' });
        //     sourceValue = link.trim();
        // }

        const scan = await Scan.create({
            organization:   organizationId,
            uploadedBy:     req.user._id,
            filename:       projectName.trim(),
            format,
            specVersion:    '',
            componentCount: 0,
            scanType:       sourceType,
            source:         sourceValue,
            status:         'running',
            startedAt:      new Date(),
            notes:          notes ? notes.trim() : '',
        });

        setImmediate(() => runScan(scan));

        return res.status(201).json({
            success: true,
            message: 'Scan created successfully 🚀',
            data: { scan },
        });

    } catch (error) {
        console.error('Create scan error:', error);
        if (error.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate scan entry.' });
        return res.status(500).json({ success: false, message: 'Server error while creating scan.' });
    }
};

// ─── LIST ────────────────────────────────────────────────────────────────────
const getScans = async (req, res) => {
    try {
        const { status, scanType, page = 1, limit = 20 } = req.query;

        const filter = buildReadScanFilter(req.user);
        if (status)   filter.status   = status;
        if (scanType) filter.scanType = scanType;

        const skip = (Number(page) - 1) * Number(limit);

        const [scans, total] = await Promise.all([
            Scan.find(filter)
                .populate('uploadedBy', 'name email')
                .populate('report')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Scan.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: { scans, total, page: Number(page), limit: Number(limit) },
        });
    } catch (error) {
        console.error('Get scans error:', error);
        return res.status(500).json({ success: false, message: 'Server error while fetching scans.' });
    }
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────
const getScanById = async (req, res) => {
    try {
        const filter = buildReadScanFilter(req.user);
        filter._id = req.params.id;

        const scan = await Scan.findOne(filter)
            .populate('uploadedBy', 'name email')
            .populate('report');

        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });

        return res.status(200).json({ success: true, data: { scan } });
    } catch (error) {
        console.error('Get scan by id error:', error);
        return res.status(500).json({ success: false, message: 'Server error while fetching scan.' });
    }
};

// ─── UPDATE STATUS (admin only) ──────────────────────────────────────────────
const updateScanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status, errorMessage, componentCount, specVersion,
            vulnTotal, vulnCritical, vulnHigh, vulnMedium, vulnLow, reportId,
        } = req.body;

        if (!['running', 'completed', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid scan status.' });
        }

        const update = { status };
        if (status === 'running')                      update.startedAt   = new Date();
        if (['completed', 'failed'].includes(status))  update.completedAt = new Date();

        if (errorMessage   !== undefined) update.errorMessage   = errorMessage;
        if (componentCount !== undefined) update.componentCount = componentCount;
        if (specVersion    !== undefined) update.specVersion    = specVersion;
        if (vulnTotal      !== undefined) update.vulnTotal      = vulnTotal;
        if (vulnCritical   !== undefined) update.vulnCritical   = vulnCritical;
        if (vulnHigh       !== undefined) update.vulnHigh       = vulnHigh;
        if (vulnMedium     !== undefined) update.vulnMedium     = vulnMedium;
        if (vulnLow        !== undefined) update.vulnLow        = vulnLow;
        if (reportId)                     update.report         = reportId;

        const scan = await Scan.findOneAndUpdate(
            { _id: id, ...buildOrgScanFilter(req.user) },
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });

        return res.status(200).json({ success: true, message: 'Scan updated.', data: { scan } });
    } catch (error) {
        console.error('Update scan status error:', error);
        return res.status(500).json({ success: false, message: 'Server error while updating scan.' });
    }
};

// ─── SEARCH ──────────────────────────────────────────────────────────────────
const searchScans = async (req, res) => {
    try {
        const { q, status, scanType, page = 1, limit = 20 } = req.query;

        if (!q?.trim()) {
            return res.status(400).json({ success: false, message: 'Search query "q" is required.' });
        }

        const regex  = new RegExp(q.trim(), 'i');
        const filter = buildReadScanFilter(req.user);

        filter.$or = [
            { filename: regex },
            // { source:   regex },
            { "source.image": regex },
{ "source.link": regex },
            { notes:    regex },
            { scanType: regex },
        ];

        if (status)   filter.status   = status;
        if (scanType) filter.scanType = scanType;

        const skip = (Number(page) - 1) * Number(limit);

        const [scans, total] = await Promise.all([
            Scan.find(filter)
                .populate('uploadedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Scan.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: { scans, total, page: Number(page), limit: Number(limit), query: q.trim() },
        });
    } catch (error) {
        console.error('Search scans error:', error);
        return res.status(500).json({ success: false, message: 'Server error while searching scans.' });
    }
};

// ─── STATS ───────────────────────────────────────────────────────────────────
const getScanStats = async (req, res) => {
    try {
        const matchFilter = buildReadScanFilter(req.user);

        const [statusCounts, vulnAgg] = await Promise.all([
            Scan.aggregate([
                { $match: matchFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Scan.aggregate([
                { $match: { ...matchFilter, status: 'completed' } },
                {
                    $group: {
                        _id:                  null,
                        totalComponents:      { $sum: '$componentCount' },
                        totalVulnerabilities: { $sum: '$vulnTotal' },
                        vulnCritical:         { $sum: '$vulnCritical' },
                        vulnHigh:             { $sum: '$vulnHigh' },
                        vulnMedium:           { $sum: '$vulnMedium' },
                        vulnLow:              { $sum: '$vulnLow' },
                    },
                },
            ]),
        ]);

        const counts = { running: 0, completed: 0, failed: 0, pending: 0 };
        statusCounts.forEach((s) => { counts[s._id] = s.count; });
        const agg = vulnAgg[0] || {};

        return res.status(200).json({
            success: true,
            data: {
                totalScans:           Object.values(counts).reduce((a, b) => a + b, 0),
                ...counts,
                totalComponents:      agg.totalComponents      || 0,
                totalVulnerabilities: agg.totalVulnerabilities || 0,
                vulnCritical:         agg.vulnCritical         || 0,
                vulnHigh:             agg.vulnHigh             || 0,
                vulnMedium:           agg.vulnMedium           || 0,
                vulnLow:              agg.vulnLow              || 0,
            },
        });
    } catch (error) {
        console.error('Get scan stats error:', error);
        return res.status(500).json({ success: false, message: 'Server error while fetching stats.' });
    }
};

// ─── DOWNLOAD PDF REPORT ──────────────────────────────────────────────────────
const downloadReport = async (req, res) => {
    try {
        const filter = buildReadScanFilter(req.user);
        filter._id = req.params.id;

        const scan = await Scan.findOne(filter)
            .populate('uploadedBy', 'name email')
            .populate('organization', 'name')
            .populate('report');

        if (!scan) {
            return res.status(404).json({ success: false, message: 'Scan not found.' });
        }

        if (scan.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'PDF report is only available for completed scans.',
            });
        }

        const { generateScanPDF } = require('../utils/pdfGenerator');
        const doc = generateScanPDF(scan, scan.report);

        const safeName = (scan.filename || 'report')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 50);
        const filename = `SBOM_Report_${safeName}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);
    } catch (error) {
        console.error('PDF download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate PDF report.' });
        }
    }
};

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
module.exports = {
    createScan,
    getScans,
    getScanById,
    updateScanStatus,
    searchScans,
    getScanStats,
    downloadReport,
};

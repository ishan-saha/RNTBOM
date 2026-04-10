const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const Report = require('../models/Report');
const { runScan } = require("../services/scanService");

const allowedSourceTypes = ['upload', 'github', 'docker', 'link'];

const getOrgId = (user) => {
    if (!user) return null;
    if (user.organization && typeof user.organization === 'object') return user.organization._id;
    return user.organization;
};

const detectFormatFromFile = (file) => {
    if (!file) return 'cyclonedx';

    const name = file.originalname.toLowerCase();

    if (name.includes('spdx') || name.endsWith('.spdx') || name.endsWith('.spdx.json')) {
        return 'spdx';
    }

    return 'cyclonedx';
};

// const createScan = async (req, res) => {
//     try {
//         const projectName = req.body.projectName;
//         const sourceType = req.body.sourceType;
//         const repoUrl = req.body.repoUrl;
//         const imageName = req.body.imageName;
//         const link = req.body.link;
//         const notes = req.body.notes;

//         const organizationId = getOrgId(req.user);

//         if (!organizationId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'User organization not found.',
//             });
//         }

//         if (!projectName || !projectName.trim()) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Project name is required.',
//             });
//         }

//         if (!sourceType || !allowedSourceTypes.includes(sourceType)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid scan source type.',
//             });
//         }

//         let sourceValue = '';
//         let format = 'cyclonedx';

//         if (sourceType === 'upload') {
//             if (!req.file) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Please upload a file.',
//                 });
//             }

//             sourceValue = req.file.path;
//             format = detectFormatFromFile(req.file);
//         }

//         if (sourceType === 'github') {
//             if (!repoUrl || !repoUrl.trim()) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Git repository URL is required.',
//                 });
//             }

//             sourceValue = repoUrl.trim();
//         }

//         if (sourceType === 'docker') {
//             if (!imageName || !imageName.trim()) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Docker image name is required.',
//                 });
//             }

//             sourceValue = imageName.trim();
//         }

//         if (sourceType === 'link') {
//             if (!link || !link.trim()) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Link is required.',
//                 });
//             }

//             sourceValue = link.trim();
//         }

//         const scan = await Scan.create({
//             organization: organizationId,
//             uploadedBy: req.user._id,
//             filename: projectName.trim(),
//             format,
//             specVersion: '',
//             componentCount: 0,
//             scanType: sourceType,
//             source: sourceValue,
//             status: 'running',
//             startedAt: new Date(),
//             notes: notes ? notes.trim() : '',
//         });

//         return res.status(201).json({
//             success: true,
//             message: 'Scan created successfully.',
//             data: {
//                 scan,
//             },
//         });
//     } catch (error) {
//         console.error('Create scan error:', error);

//         if (error.code === 11000) {
//             return res.status(409).json({
//                 success: false,
//                 message: 'Duplicate scan entry.',
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: 'Server error while creating scan.',
//         });
//     }
// };

const createScan = async (req, res) => {
    try {
        // 🔍 DEBUG (remove later)
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        // ✅ Safe extraction (important for FormData)
        const projectName = req.body.projectName;
        const sourceTypeRaw = req.body.sourceType;
        const repoUrl = req.body.repoUrl;
        const imageName = req.body.imageName;
        const link = req.body.link;
        const notes = req.body.notes;

        // ✅ Clean & normalize sourceType
        const sourceType = sourceTypeRaw?.toString().trim().toLowerCase();

        // ✅ Allowed types
        const allowedSourceTypes = ['upload', 'github', 'docker', 'link'];

        // 🏢 Get organization from user
        console.log("USER:", req.user);
        const organizationId = req.user.organization || req.user._id;
        // const organizationId = getOrgId(req.user);

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'User organization not found.',
            });
        }

        // 📝 Validate project name
        if (!projectName || !projectName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required.',
            });
        }

        // 🔍 Validate source type
        if (!sourceType || !allowedSourceTypes.includes(sourceType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scan source type.',
            });
        }

        let sourceValue = '';
        let format = 'cyclonedx';

        // 📂 FILE UPLOAD
        if (sourceType === 'upload') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'File not received. Please upload again.',
                });
            }

            sourceValue = req.file.path;
        }

        // 🐙 GITHUB
        if (sourceType === 'github') {
            if (!repoUrl || !repoUrl.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Git repository URL is required.',
                });
            }

            sourceValue = repoUrl.trim();
        }

        // 🐳 DOCKER
        if (sourceType === 'docker') {
            if (!imageName || !imageName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Docker image name is required.',
                });
            }

            sourceValue = imageName.trim();
        }

        // 🔗 LINK
        if (sourceType === 'link') {
            if (!link || !link.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Link is required.',
                });
            }

            sourceValue = link.trim();
        }

        // 🚀 CREATE SCAN
        // 🚀 CREATE SCAN
        const scan = await Scan.create({
            organization: organizationId,
            uploadedBy: req.user._id,

            filename: projectName.trim(),
            format,
            specVersion: '',
            componentCount: 0,

            scanType: sourceType,
            source: sourceValue,

            status: 'running',
            startedAt: new Date(),

            notes: notes ? notes.trim() : '',
        });

        // 🔥 IMPORTANT: RUN SCAN ASYNC
        setImmediate(() => {
            runScan(scan);
        });

        return res.status(201).json({
            success: true,
            message: 'Scan created successfully 🚀',
            data: { scan },
        });

    } catch (error) {
        console.error('Create scan error:', error);

        // 🔁 Duplicate error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate scan entry.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error while creating scan.',
        });
    }
};
const getScans = async (req, res) => {
    try {
        const organizationId = getOrgId(req.user);
        const { status, scanType, page = 1, limit = 20 } = req.query;

        const filter = {
            organization: organizationId,
        };

        if (status) filter.status = status;
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
            data: {
                scans,
                total,
                page: Number(page),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get scans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching scans.',
        });
    }
};

const getScanById = async (req, res) => {
    try {
        const organizationId = getOrgId(req.user);

        const scan = await Scan.findOne({
            _id: req.params.id,
            organization: organizationId,
        })
            .populate('uploadedBy', 'name email')
            .populate('report');

        if (!scan) {
            return res.status(404).json({
                success: false,
                message: 'Scan not found.',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                scan,
            },
        });
    } catch (error) {
        console.error('Get scan by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching scan.',
        });
    }
};

// Use this later from your scanner worker when CycloneDX/Syft finishes
const updateScanStatus = async (req, res) => {
    try {
        const organizationId = getOrgId(req.user);
        const { id } = req.params;

        const {
            status,
            errorMessage,
            componentCount,
            specVersion,
            vulnTotal,
            vulnCritical,
            vulnHigh,
            vulnMedium,
            vulnLow,
            reportId,
        } = req.body;

        if (!['running', 'completed', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scan status.',
            });
        }

        const update = {
            status,
        };

        if (status === 'running' && !update.startedAt) {
            update.startedAt = new Date();
        }

        if (status === 'completed' || status === 'failed') {
            update.completedAt = new Date();
        }

        if (errorMessage !== undefined) update.errorMessage = errorMessage;
        if (componentCount !== undefined) update.componentCount = componentCount;
        if (specVersion !== undefined) update.specVersion = specVersion;
        if (vulnTotal !== undefined) update.vulnTotal = vulnTotal;
        if (vulnCritical !== undefined) update.vulnCritical = vulnCritical;
        if (vulnHigh !== undefined) update.vulnHigh = vulnHigh;
        if (vulnMedium !== undefined) update.vulnMedium = vulnMedium;
        if (vulnLow !== undefined) update.vulnLow = vulnLow;
        if (reportId) update.report = reportId;

        const scan = await Scan.findOneAndUpdate(
            { _id: id, organization: organizationId },
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!scan) {
            return res.status(404).json({
                success: false,
                message: 'Scan not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Scan updated successfully.',
            data: { scan },
        });
    } catch (error) {
        console.error('Update scan status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating scan.',
        });
    }
};

module.exports = {
    createScan,
    getScans,
    getScanById,
    updateScanStatus,
};
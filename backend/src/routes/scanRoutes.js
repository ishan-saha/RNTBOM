const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
    createScan,
    getScans,
    getScanById,
    updateScanStatus,
    searchScans,
    getScanStats,
} = require('../controllers/scanController');

const router = express.Router();

router.post(
    '/',
    protect,

    // ✅ 1. multer first
    upload.single('file'),

    // ✅ 2. then validation
    [
        body('projectName')
            .notEmpty()
            .withMessage('Project name is required'),

        body('sourceType')
            .notEmpty()
            .withMessage('Source type required')
            .isIn(['upload', 'github', 'docker', 'link'])
            .withMessage('Invalid source type'),
    ],

    // ✅ 3. validate
    validate,

    // ✅ 4. controller
    createScan
);

router.get('/', protect, getScans);
router.get('/stats', protect, getScanStats);  // ⚠️ before /:id
router.get('/search', protect, searchScans);  // ⚠️ before /:id
router.get('/:id', protect, getScanById);

// Keep this for your scanner worker / admin task later
router.patch('/:id/status', protect, authorize('admin'), updateScanStatus);

module.exports = router;
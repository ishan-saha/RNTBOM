const express = require('express');
const { body, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  detectVendorFromText,
  getRules,
  runAssessment,
  runLiveScan,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
  exportCsv,
} = require('../controllers/firewallAssessmentController');

const router = express.Router();

const VENDORS = 'auto|aws|cisco|paloalto|fortinet';

// Vendor detection
router.post(
  '/detect',
  protect,
  [body('configText').notEmpty().withMessage('configText is required')],
  validate,
  detectVendorFromText
);

// List rules for a vendor
router.get(
  '/rules',
  protect,
  [query('vendor').notEmpty().withMessage('vendor query param is required')],
  validate,
  getRules
);

// Run assessment (optionally save with `save: true`)
router.post(
  '/',
  protect,
  [
    body('configText')
      .notEmpty()
      .withMessage('configText is required')
      .isLength({ min: 20 })
      .withMessage('configText must be at least 20 characters'),
    body('vendor')
      .optional()
      .isIn(VENDORS.split('|'))
      .withMessage(`Vendor must be one of: ${VENDORS}`),
  ],
  validate,
  runAssessment
);

// Live AWS scan (simulated)
router.post(
  '/live-scan',
  protect,
  [
    body('accessKeyId').notEmpty().withMessage('AWS Access Key ID is required'),
    body('secretAccessKey').notEmpty().withMessage('AWS Secret Access Key is required'),
  ],
  validate,
  runLiveScan
);

// List saved assessments
router.get('/', protect, getAssessments);

// Export CSV from saved assessment
router.get('/:id/csv', protect, exportCsv);

// Export CSV from inline findings (POST)
router.post(
  '/export-csv',
  protect,
  [body('findings').isArray({ min: 1 }).withMessage('findings array is required')],
  validate,
  exportCsv
);

// Get single assessment
router.get('/:id', protect, getAssessmentById);

// Delete assessment
router.delete('/:id', protect, deleteAssessment);

module.exports = router;

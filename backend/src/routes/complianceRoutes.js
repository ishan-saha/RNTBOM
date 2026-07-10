const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  runComplianceScan,
  getScanResults,
  listScans,
  deleteScan,
} = require('../controllers/complianceController');

const router = express.Router();

router.post(
  '/run',
  protect,
  [
    body('benchmarkId')
      .notEmpty()
      .withMessage('benchmarkId is required')
      .isMongoId()
      .withMessage('Invalid benchmarkId'),
    body('parsedConfigurationId')
      .notEmpty()
      .withMessage('parsedConfigurationId is required')
      .isMongoId()
      .withMessage('Invalid parsedConfigurationId'),
  ],
  validate,
  runComplianceScan
);

router.get('/', protect, listScans);
router.get('/:scanId', protect, getScanResults);
router.delete('/:scanId', protect, deleteScan);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { parseConfigurations, listUserConfigs } = require('../controllers/configurationController');
const uploadConfig = require('../middleware/uploadConfig');

const router = express.Router();

router.post(
  '/parse',
  protect,
  uploadConfig.array('files', 20),
  [
    body('benchmarkId')
      .notEmpty()
      .withMessage('benchmarkId is required')
      .isMongoId()
      .withMessage('Invalid benchmarkId format'),
  ],
  validate,
  parseConfigurations
);

router.get(
  '/',
  protect,
  listUserConfigs
);

module.exports = router;

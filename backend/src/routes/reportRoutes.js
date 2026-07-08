const express = require('express');
const { protect } = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/:scanId', protect, getReport);

module.exports = router;

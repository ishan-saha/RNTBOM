const express = require('express');
const { protect } = require('../middleware/auth');
const { getPDF, getExcel, getCSV } = require('../controllers/exportController');

const router = express.Router();

router.get('/pdf/:scanId', protect, getPDF);
router.get('/excel/:scanId', protect, getExcel);
router.get('/csv/:scanId', protect, getCSV);

module.exports = router;

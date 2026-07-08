const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { importBenchmarkPdf, getBenchmarks, getBenchmarkById } = require('../controllers/benchmarkController');
const uploadBenchmark = require('../middleware/uploadBenchmark');

const router = express.Router();

router.get('/', protect, getBenchmarks);
router.get('/:id', protect, getBenchmarkById);

router.post(
  '/import',
  protect,
  authorize('admin'),
  uploadBenchmark.single('pdf'),
  importBenchmarkPdf
);

module.exports = router;

const { importBenchmark } = require('../services/benchmarkImportService');
const logger = require('../utils/logger');
const fs = require('fs');

const importBenchmarkPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    if (req.file.size === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Uploaded file is empty' });
    }

    const result = await importBenchmark(req.file.path, req.file.originalname);

    return res.status(201).json({
      success: true,
      message: 'Benchmark imported successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Benchmark import controller error', { error: error.message });

    if (error.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message.includes('File not found') ||
        error.message.includes('No recommendations found') ||
        error.message.includes('Only PDF files') ||
        error.message.includes('contains no extractable text')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message.includes('PDF') ||
        error.message.includes('password') ||
        error.message.includes('encrypted') ||
        error.message.includes('Failed to parse') ||
        error.message.includes('Failed to load PDF parser')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to import benchmark' });
  }
};

const getBenchmarks = async (req, res) => {
  try {
    const Benchmark = require('../models/Benchmark');
    const BenchmarkRule = require('../models/BenchmarkRule');
    const benchmarks = await Benchmark.find().sort({ createdAt: -1 }).lean();

    const withCounts = await Promise.all(
      benchmarks.map(async (b) => {
        const ruleCount = await BenchmarkRule.countDocuments({ benchmarkId: b._id });
        const automatedCount = await BenchmarkRule.countDocuments({
          benchmarkId: b._id,
          'comparison.isAutomated': true,
        });
        return {
          ...b,
          ruleCount,
          automatedCount,
          manualCount: ruleCount - automatedCount,
        };
      })
    );

    return res.json({ success: true, data: { benchmarks: withCounts } });
  } catch (error) {
    logger.error('Get benchmarks error', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBenchmarkById = async (req, res) => {
  try {
    const Benchmark = require('../models/Benchmark');
    const BenchmarkRule = require('../models/BenchmarkRule');
    const benchmark = await Benchmark.findById(req.params.id).lean();
    if (!benchmark) {
      return res.status(404).json({ success: false, message: 'Benchmark not found' });
    }

    const rules = await BenchmarkRule.find({ benchmarkId: benchmark._id })
      .sort({ ruleId: 1 })
      .lean();

    return res.json({ success: true, data: { ...benchmark, rules } });
  } catch (error) {
    logger.error('Get benchmark by ID error', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBenchmark = async (req, res) => {
  try {
    const Benchmark = require('../models/Benchmark');
    const BenchmarkRule = require('../models/BenchmarkRule');
    const benchmark = await Benchmark.findById(req.params.id);
    if (!benchmark) {
      return res.status(404).json({ success: false, message: 'Benchmark not found' });
    }

    await BenchmarkRule.deleteMany({ benchmarkId: benchmark._id });
    await Benchmark.findByIdAndDelete(benchmark._id);

    logger.info('Benchmark deleted', { benchmarkId: benchmark._id, name: benchmark.name });
    return res.json({ success: true, message: 'Benchmark deleted successfully' });
  } catch (error) {
    logger.error('Delete benchmark error', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { importBenchmarkPdf, getBenchmarks, getBenchmarkById, deleteBenchmark };

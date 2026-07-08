const { importBenchmark } = require('../services/benchmarkImportService');

const importBenchmarkPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const result = await importBenchmark(req.file.path, req.file.originalname);

    return res.status(201).json({
      success: true,
      message: 'Benchmark imported successfully',
      data: result,
    });
  } catch (error) {
    console.error('Benchmark import error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message.includes('No recommendations found') ||
        error.message.includes('No valid rules') ||
        error.message.includes('Only PDF files') ||
        error.message.includes('contains no extractable text') ||
        error.message.includes('Failed to read PDF') ||
        error.message.includes('Failed to parse PDF')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to import benchmark. Please try again.' });
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
        return { ...b, ruleCount };
      })
    );

    return res.json({ success: true, data: { benchmarks: withCounts } });
  } catch (error) {
    console.error('Get benchmarks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBenchmarkById = async (req, res) => {
  try {
    const Benchmark = require('../models/Benchmark');
    const BenchmarkRule = require('../models/BenchmarkRule');
    const benchmark = await Benchmark.findById(req.params.id).lean();
    if (!benchmark) return res.status(404).json({ success: false, message: 'Not found' });

    const rules = await BenchmarkRule.find({ benchmarkId: benchmark._id }).lean();
    return res.json({ success: true, data: { ...benchmark, rules } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { importBenchmarkPdf, getBenchmarks, getBenchmarkById };

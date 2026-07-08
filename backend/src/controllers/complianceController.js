const mongoose = require('mongoose');
const Benchmark = require('../models/Benchmark');
const ParsedConfiguration = require('../models/ParsedConfiguration');
const ComplianceScan = require('../models/ComplianceScan');
const ComplianceResult = require('../models/ComplianceResult');
const { runScan } = require('../rule-engine/ruleEngine');

const runComplianceScan = async (req, res) => {
  try {
    const { benchmarkId, parsedConfigurationId } = req.body;

    if (!benchmarkId || !parsedConfigurationId) {
      return res.status(400).json({
        success: false,
        message: 'benchmarkId and parsedConfigurationId are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(benchmarkId)) {
      return res.status(400).json({ success: false, message: 'Invalid benchmarkId' });
    }
    if (!mongoose.Types.ObjectId.isValid(parsedConfigurationId)) {
      return res.status(400).json({ success: false, message: 'Invalid parsedConfigurationId' });
    }

    const benchmark = await Benchmark.findById(benchmarkId);
    if (!benchmark) {
      return res.status(404).json({ success: false, message: 'Benchmark not found' });
    }

    const parsedConfig = await ParsedConfiguration.findById(parsedConfigurationId);
    if (!parsedConfig) {
      return res.status(404).json({ success: false, message: 'Parsed configuration not found' });
    }

    if (String(parsedConfig.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this configuration' });
    }

    const complianceScan = await ComplianceScan.create({
      userId: req.user._id,
      benchmarkId,
      parsedConfigurationId,
      status: 'running',
    });

    try {
      const config = parsedConfig.normalizedConfiguration || {};
      const { results, summary } = await runScan(benchmarkId, config, parsedConfigurationId);

      const resultDocs = results.map(r => ({
        scanId: complianceScan._id,
        ...r,
      }));

      await ComplianceResult.insertMany(resultDocs);

      complianceScan.summary = summary;
      complianceScan.status = 'completed';
      await complianceScan.save();

      return res.status(200).json({
        success: true,
        data: {
          scanId: complianceScan._id,
          summary,
          results,
        },
      });
    } catch (err) {
      complianceScan.status = 'failed';
      complianceScan.errorMessage = err.message;
      await complianceScan.save();

      return res.status(500).json({
        success: false,
        message: `Compliance scan failed: ${err.message}`,
      });
    }
  } catch (error) {
    console.error('Compliance scan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run compliance scan',
    });
  }
};

const getScanResults = async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await ComplianceScan.findOne({
      _id: scanId,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    const results = await ComplianceResult.find({ scanId }).sort({ ruleId: 1 });

    return res.status(200).json({
      success: true,
      data: {
        scan,
        results,
      },
    });
  } catch (error) {
    console.error('Get scan results error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch scan results' });
  }
};

const listScans = async (req, res) => {
  try {
    const scans = await ComplianceScan.find({ userId: req.user._id })
      .populate('benchmarkId', 'name version')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: { scans },
    });
  } catch (error) {
    console.error('List scans error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list scans' });
  }
};

module.exports = { runComplianceScan, getScanResults, listScans };

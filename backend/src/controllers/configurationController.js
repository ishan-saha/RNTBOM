const mongoose = require('mongoose');
const ParsedConfiguration = require('../models/ParsedConfiguration');
const Benchmark = require('../models/Benchmark');
const { parseAndStore } = require('../services/configurationParseService');

const parseConfigurations = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one configuration file is required' });
    }

    const { benchmarkId } = req.body;
    if (!benchmarkId) {
      return res.status(400).json({ success: false, message: 'benchmarkId is required' });
    }

    const filePaths = req.files.map(f => f.path);

    const result = await parseAndStore(benchmarkId, req.user._id, filePaths);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Configuration parse error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message.includes('Invalid JSON') ||
        error.message.includes('Invalid YAML') ||
        error.message.includes('Invalid XML') ||
        error.message.includes('Invalid INI') ||
        error.message.includes('Invalid plist')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to parse configuration files' });
  }
};

const listUserConfigs = async (req, res) => {
  try {
    const configs = await ParsedConfiguration.find({ userId: req.user._id })
      .populate('benchmarkId', 'name version')
      .sort({ createdAt: -1 })
      .lean();

    const result = configs.map(c => ({
      _id: c._id,
      benchmarkId: c.benchmarkId?._id || c.benchmarkId,
      benchmarkName: c.benchmarkId?.name || 'Unknown',
      benchmarkVersion: c.benchmarkId?.version || '',
      fileName: c.uploadedFiles?.[0]?.fileName || 'Unknown',
      fileCount: c.uploadedFiles?.length || 0,
      keyCount: c.normalizedConfiguration ? Object.keys(c.normalizedConfiguration).length : 0,
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
    }));

    return res.json({ success: true, data: { configurations: result } });
  } catch (error) {
    console.error('List configs error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { parseConfigurations, listUserConfigs };

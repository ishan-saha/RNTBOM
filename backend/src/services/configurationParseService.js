const path = require('path');
const mongoose = require('mongoose');
const Benchmark = require('../models/Benchmark');
const ParsedConfiguration = require('../models/ParsedConfiguration');
const { parseConfigurations } = require('../configuration-parser/configurationParser');

async function parseAndStore(benchmarkId, userId, filePaths) {
  if (!benchmarkId || !userId) {
    throw new Error('benchmarkId and userId are required');
  }

  if (!filePaths || filePaths.length === 0) {
    throw new Error('At least one file must be uploaded');
  }

  if (!mongoose.Types.ObjectId.isValid(benchmarkId)) {
    throw new Error('Invalid benchmarkId');
  }

  const benchmark = await Benchmark.findById(benchmarkId);
  if (!benchmark) {
    throw new Error('Benchmark not found');
  }

  const result = await parseConfigurations(filePaths);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const uploadedFiles = result.parsedConfigurations.map(pc => ({
    fileName: pc.fileName,
    parser: pc.parser,
    warnings: pc.warnings || [],
  }));

  const parsedConfig = await ParsedConfiguration.create({
    benchmarkId,
    userId,
    uploadedFiles,
    normalizedConfiguration: result.normalizedConfiguration,
    createdAt: now,
    expiresAt,
  });

  return {
    parsedConfigurationId: parsedConfig._id,
    benchmarkId,
    parsedConfigurations: result.parsedConfigurations,
    normalizedConfiguration: result.normalizedConfiguration,
    warnings: result.warnings,
    errors: result.errors,
  };
}

module.exports = { parseAndStore };

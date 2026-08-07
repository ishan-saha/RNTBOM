const path = require('path');
const mongoose = require('mongoose');
const Benchmark = require('../models/Benchmark');
const ParsedConfiguration = require('../models/ParsedConfiguration');
const { parseConfigurations } = require('../configuration-parser/configurationParser');
const logger = require('../utils/logger');

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

  logger.info('Configuration parse started', { fileCount: filePaths.length, benchmarkId });

  const startTime = Date.now();
  const result = await parseConfigurations(filePaths);
  const processingTime = Date.now() - startTime;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const usedParsers = [...new Set(result.parsedConfigurations.map(pc => pc.parser))];

  const uploadedFiles = result.parsedConfigurations.map(pc => ({
    fileName: pc.fileName,
    parser: pc.parser,
    warnings: pc.warnings || [],
  }));

  const keyCount = result.normalizedConfiguration
    ? Object.keys(result.normalizedConfiguration).length
    : 0;

  const config = await ParsedConfiguration.create({
    benchmarkId,
    userId,
    uploadedFiles,
    normalizedConfiguration: result.normalizedConfiguration,
    parserUsed: usedParsers,
    keyCount,
    parsingWarnings: result.warnings || [],
    processingTime,
    createdAt: now,
    expiresAt,
  });

  logger.info('Configuration parse completed', {
    configId: config._id,
    filesUploaded: filePaths.length,
    filesParsed: result.parsedConfigurations.length,
    failedFiles: result.errors.length,
    keyCount,
    processingTime,
    parsers: usedParsers,
  });

  return {
    parsedConfigurationId: config._id,
    benchmarkId,
    filesUploaded: filePaths.length,
    filesParsedSuccessfully: result.parsedConfigurations.length,
    failedFiles: result.errors.length,
    totalKeysExtracted: keyCount,
    duplicateKeysRemoved: 0,
    parsingWarnings: result.warnings || [],
    fileErrors: result.errors || [],
    parsersUsed: usedParsers,
    processingTime,
    normalizedConfiguration: result.normalizedConfiguration,
  };
}

module.exports = { parseAndStore };

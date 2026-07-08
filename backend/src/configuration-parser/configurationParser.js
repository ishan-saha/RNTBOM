const path = require('path');
const fs = require('fs');
const { getParserForFile } = require('./parserFactory');
const { normalizeConfiguration } = require('./normalizer');
const { validateConfiguration } = require('./validator');

function readFileContent(filePath) {
  return fs.readFileSync(filePath);
}

function detectMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.json': 'application/json',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.xml': 'application/xml',
    '.plist': 'application/x-plist',
    '.ini': 'text/x-ini',
    '.cfg': 'text/x-ini',
    '.conf': 'text/plain',
    '.reg': 'text/x-registry',
    '.properties': 'text/x-java-properties',
    '.props': 'text/x-java-properties',
  };
  return mimeMap[ext] || 'text/plain';
}

async function parseConfigurationFile(filePath) {
  const fileName = path.basename(filePath);
  const content = readFileContent(filePath);
  const mimeType = detectMimeType(filePath);
  const contentStr = content.toString('utf-8');

  const parser = getParserForFile(filePath, mimeType, contentStr);

  const result = await Promise.resolve(parser.parse(contentStr, filePath));

  const normalized = normalizeConfiguration(result.config);

  const { config: validatedConfig, warnings: validationWarnings } = validateConfiguration(
    normalized,
    result.warnings || []
  );

  return {
    fileName,
    parser: parser.name,
    config: validatedConfig,
    warnings: validationWarnings,
  };
}

async function parseConfigurations(filePaths) {
  const results = [];
  const errors = [];

  for (const filePath of filePaths) {
    try {
      const result = await parseConfigurationFile(filePath);
      results.push(result);
    } catch (err) {
      errors.push({
        fileName: path.basename(filePath),
        error: err.message,
      });
    }
  }

  const mergedConfig = {};
  const allWarnings = [];

  for (const result of results) {
    if (result.warnings && result.warnings.length > 0) {
      allWarnings.push(...result.warnings.map(w => `${result.fileName}: ${w}`));
    }
    Object.assign(mergedConfig, result.config);
  }

  const { config: finalConfig, warnings: finalWarnings } = validateConfiguration(mergedConfig, allWarnings);

  return {
    parsedConfigurations: results,
    normalizedConfiguration: finalConfig,
    warnings: finalWarnings,
    errors,
  };
}

module.exports = { parseConfigurationFile, parseConfigurations };

const path = require('path');

const parsers = [
  require('./parsers/jsonParser'),
  require('./parsers/yamlParser'),
  require('./parsers/xmlParser'),
  require('./parsers/iniParser'),
  require('./parsers/propertiesParser'),
  require('./parsers/registryParser'),
  require('./parsers/plistParser'),
  require('./parsers/sshParser'),
  require('./parsers/sysctlParser'),
  require('./parsers/dockerParser'),
  require('./parsers/kubernetesParser'),
  require('./parsers/nginxParser'),
  require('./parsers/genericTextParser'),
];

const extensionMap = new Map();
const mimeMap = new Map();
const contentDetectors = [];

for (const parser of parsers) {
  if (parser.supportedExtensions) {
    for (const ext of parser.supportedExtensions) {
      if (!extensionMap.has(ext)) {
        extensionMap.set(ext, parser);
      }
    }
  }

  if (parser.supportedMimes) {
    for (const mime of parser.supportedMimes) {
      if (!mimeMap.has(mime)) {
        mimeMap.set(mime, parser);
      }
    }
  }

  if (parser.detect) {
    contentDetectors.push(parser);
  }
}

function getParserForFile(filePath, mimeType, content) {
  if (!filePath) {
    return getGenericParser();
  }

  const ext = path.extname(filePath).toLowerCase();

  for (const detector of contentDetectors) {
    try {
      if (detector.detect(content, filePath)) {
        return detector;
      }
    } catch {
    }
  }

  if (mimeType && mimeMap.has(mimeType)) {
    const mimeParser = mimeMap.get(mimeType);
    if (mimeParser.name !== 'generic') {
      return mimeParser;
    }
  }

  if (ext && extensionMap.has(ext)) {
    return extensionMap.get(ext);
  }

  if (mimeType && mimeMap.has(mimeType)) {
    return mimeMap.get(mimeType);
  }

  return getGenericParser();
}

function getGenericParser() {
  for (const parser of parsers) {
    if (parser.name === 'generic') return parser;
  }
  return parsers[parsers.length - 1];
}

function getAllParsers() {
  return parsers.map(p => ({
    name: p.name,
    extensions: p.supportedExtensions || [],
    mimes: p.supportedMimes || [],
  }));
}

module.exports = { getParserForFile, getAllParsers };

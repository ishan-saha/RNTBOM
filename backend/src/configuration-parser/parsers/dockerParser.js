const path = require('path');

function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const fileName = filePath ? path.basename(filePath).toLowerCase() : '';

  if (fileName === 'daemon.json') {
    const jsonParser = require('./jsonParser');
    return jsonParser.parse(content, filePath);
  }

  if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') {
    const yamlParser = require('./yamlParser');
    const result = yamlParser.parse(content, filePath);

    if (result.config && result.config.services) {
      const extracted = {};
      for (const [serviceName, serviceConfig] of Object.entries(result.config.services)) {
        if (serviceConfig && typeof serviceConfig === 'object') {
          for (const [key, value] of Object.entries(serviceConfig)) {
            extracted[`${serviceName}.${key}`] = value;
          }
        }
      }
      return { config: extracted, warnings: [...warnings, ...result.warnings] };
    }

    return result;
  }

  if (fileName.endsWith('.json')) {
    const jsonParser = require('./jsonParser');
    return jsonParser.parse(content, filePath);
  }

  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    const yamlParser = require('./yamlParser');
    return yamlParser.parse(content, filePath);
  }

  warnings.push(`Unknown Docker file format: ${fileName}. Processing as generic text.`);
  const textParser = require('./genericTextParser');
  return textParser.parse(content, filePath);
}

module.exports = {
  name: 'docker',
  supportedExtensions: ['.json', '.yml', '.yaml'],
  supportedMimes: [],
  detect(content, filePath) {
    if (!filePath) return false;
    const name = path.basename(filePath).toLowerCase();
    return name === 'daemon.json' ||
           name === 'docker-compose.yml' ||
           name === 'docker-compose.yaml' ||
           name.startsWith('docker');
  },
  parse,
};

const yaml = require('js-yaml');

function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');

  let parsed;
  try {
    parsed = yaml.load(source);
  } catch (err) {
    throw new Error(`Invalid YAML: ${err.message}`);
  }

  if (parsed === null || parsed === undefined) {
    return { config: {}, warnings: ['File contains null value'] };
  }

  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
    return { config: { value: parsed }, warnings };
  }

  if (Array.isArray(parsed)) {
    return { config: parsed, warnings };
  }

  return { config: parsed, warnings };
}

module.exports = {
  name: 'yaml',
  supportedExtensions: ['.yaml', '.yml'],
  supportedMimes: ['application/x-yaml', 'text/yaml', 'text/vnd.yaml'],
  parse,
};

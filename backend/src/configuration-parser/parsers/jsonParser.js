function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(typeof content === 'string' ? content : content.toString('utf-8'));
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  if (parsed === null || parsed === undefined) {
    return { config: {}, warnings: ['File contains null value'] };
  }

  if (typeof parsed !== 'object') {
    return { config: { value: parsed }, warnings };
  }

  return { config: parsed, warnings };
}

module.exports = {
  name: 'json',
  supportedExtensions: ['.json'],
  supportedMimes: ['application/json'],
  parse,
};

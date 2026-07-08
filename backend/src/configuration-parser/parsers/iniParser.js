const ini = require('ini');

function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');

  let parsed;
  try {
    parsed = ini.parse(source);
  } catch (err) {
    throw new Error(`Invalid INI format: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    return { config: {}, warnings: ['Unable to parse INI structure'] };
  }

  return { config: parsed, warnings };
}

module.exports = {
  name: 'ini',
  supportedExtensions: ['.ini', '.cfg', '.conf'],
  supportedMimes: ['text/x-ini', 'application/x-ini'],
  parse,
};

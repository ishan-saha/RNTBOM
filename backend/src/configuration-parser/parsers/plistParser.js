async function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');

  let plistModule;
  try {
    plistModule = await import('plist');
  } catch (err) {
    throw new Error(`Failed to load plist parser: ${err.message}`);
  }

  let parsed;
  try {
    parsed = plistModule.parse(source);
  } catch (err) {
    throw new Error(`Invalid plist: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    return { config: {}, warnings: ['Unable to parse plist structure'] };
  }

  return { config: parsed, warnings };
}

module.exports = {
  name: 'plist',
  supportedExtensions: ['.plist'],
  supportedMimes: ['application/x-plist', 'text/x-plist'],
  parse,
};

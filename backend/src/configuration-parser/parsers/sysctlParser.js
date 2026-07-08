function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = source.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();

    if (line === '' || line.startsWith('#') || line.startsWith(';')) continue;

    const match = line.match(/^([a-zA-Z0-9_.]+)\s*=\s*(.*)/);
    if (!match) {
      warnings.push(`Unrecognized line ${lineNo + 1}: "${lines[lineNo].trim()}"`);
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();

    if (config[key] !== undefined) {
      warnings.push(`Duplicate key "${key}" at line ${lineNo + 1}`);
    }

    config[key] = value;
  }

  return { config, warnings };
}

module.exports = {
  name: 'sysctl',
  supportedExtensions: ['.sysctl', '.sysctl.conf', 'sysctl.conf', 'sysctl.d'],
  supportedMimes: [],
  detect(content, filePath) {
    if (!filePath) return false;
    const name = filePath.toLowerCase();
    return name.includes('sysctl');
  },
  parse,
};

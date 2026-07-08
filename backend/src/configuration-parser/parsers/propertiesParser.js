function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = source.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    let line = lines[lineNo];

    if (line.trim() === '' || line.trim().startsWith('#') || line.trim().startsWith('!')) {
      continue;
    }

    if (line.includes('\\\n')) {
      const continuation = [line];
      while (lineNo + 1 < lines.length && lines[lineNo + 1].trimStart().startsWith('\\')) {
        lineNo++;
        continuation.push(lines[lineNo].replace(/^\s*\\\s*/, ''));
      }
      line = continuation.join('');
    }

    const eqIndex = line.indexOf('=');
    const colonIndex = line.indexOf(':');
    let separator;

    if (eqIndex === -1 && colonIndex === -1) continue;

    if (eqIndex === -1) separator = colonIndex;
    else if (colonIndex === -1) separator = eqIndex;
    else separator = Math.min(eqIndex, colonIndex);

    const key = line.substring(0, separator).trim();
    let value = line.substring(separator + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    if (key) {
      if (config[key] !== undefined) {
        warnings.push(`Duplicate key "${key}" at line ${lineNo + 1}`);
      }
      config[key] = value;
    }
  }

  return { config, warnings };
}

module.exports = {
  name: 'properties',
  supportedExtensions: ['.properties', '.props', '.config'],
  supportedMimes: ['text/x-java-properties', 'application/x-java-properties'],
  parse,
};

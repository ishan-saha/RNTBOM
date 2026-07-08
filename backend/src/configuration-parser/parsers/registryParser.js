const LINE_PATTERNS = [
  { pattern: /^"([^"]+)"\s*=\s*dword:\s*([0-9a-fA-F]+)/, keyIndex: 1, valueIndex: 2, transform: (v) => parseInt(v, 16) },
  { pattern: /^"([^"]+)"\s*=\s*qword:\s*([0-9a-fA-F]+)/, keyIndex: 1, valueIndex: 2, transform: (v) => parseInt(v, 16) },
  { pattern: /^"([^"]+)"\s*=\s*hex:\s*(.+)/, keyIndex: 1, valueIndex: 2, transform: (v) => v.trim() },
  { pattern: /^"([^"]+)"\s*=\s*hex\(([0-9a-fA-F]+)\):\s*(.+)/, keyIndex: 1, valueIndex: 3, transform: (v) => v.trim() },
  { pattern: /^"([^"]+)"\s*=\s*"(.+)"/, keyIndex: 1, valueIndex: 2, transform: (v) => v },
  { pattern: /^"([^"]+)"\s*=\s*[-+]?\d+/, keyIndex: 1, valueIndex: 0, transform: (v) => {
      const num = v.split('=')[1].trim();
      return isNaN(Number(num)) ? num : Number(num);
    }
  },
];

function parseRegistryPath(headerLine) {
  const match = headerLine.match(/\[(.+?)\]/);
  if (!match) return null;
  return match[1];
}

function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-16le');
  const lines = source.split(/\r?\n/);

  let currentPath = null;

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();

    if (line === '' || line.startsWith(';') || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      currentPath = parseRegistryPath(line);
      continue;
    }

    if (!currentPath || !line.includes('=')) continue;

    for (const lp of LINE_PATTERNS) {
      const match = line.match(lp.pattern);
      if (match) {
        const valueName = match[lp.keyIndex];
        const rawValue = match[lp.valueIndex];
        const transformed = lp.transform(rawValue);

        if (config[valueName] !== undefined) {
          warnings.push(`Duplicate registry value "${valueName}" at line ${lineNo + 1}`);
        }

        config[valueName] = transformed;
        break;
      }
    }
  }

  if (Object.keys(config).length === 0 && lines.length > 0) {
    warnings.push('No registry values could be parsed');
  }

  return { config, warnings };
}

module.exports = {
  name: 'registry',
  supportedExtensions: ['.reg'],
  supportedMimes: ['text/x-registry'],
  parse,
};

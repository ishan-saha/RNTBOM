function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = source.split(/\r?\n/);

  let currentSection = '';

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();

    if (line === '' || line.startsWith('#') || line.startsWith(';') || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1).trim();
      continue;
    }

    const eqMatch = line.match(/^([^=:]+)[=:]?\s*(.*)/);
    if (eqMatch) {
      let key = eqMatch[1].trim();
      let value = eqMatch[2] ? eqMatch[2].trim() : '';

      if (key && value) {
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }

        const fullKey = currentSection ? `${currentSection}.${key}` : key;

        if (config[fullKey] !== undefined) {
          if (!Array.isArray(config[fullKey])) {
            config[fullKey] = [config[fullKey]];
          }
          config[fullKey].push(value);
        } else {
          config[fullKey] = value;
        }
      } else if (key) {
        config[key] = key;
      }
    }
  }

  if (Object.keys(config).length === 0 && lines.length > 0) {
    warnings.push('No key-value pairs could be extracted');
  }

  return { config, warnings };
}

module.exports = {
  name: 'generic',
  supportedExtensions: [],
  supportedMimes: ['text/plain'],
  parse,
};

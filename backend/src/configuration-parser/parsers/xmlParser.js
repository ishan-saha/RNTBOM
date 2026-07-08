const { XMLParser } = require('fast-xml-parser');

function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
    isArray: (name) => false,
  });

  let parsed;
  try {
    parsed = parser.parse(source);
  } catch (err) {
    throw new Error(`Invalid XML: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    return { config: {}, warnings: ['Unable to parse XML structure'] };
  }

  return { config: parsed, warnings };
}

module.exports = {
  name: 'xml',
  supportedExtensions: ['.xml', '.plist'],
  supportedMimes: ['application/xml', 'text/xml'],
  parse,
};

const yaml = require('js-yaml');

function flattenResource(obj, prefix) {
  const result = {};
  const sep = '.';

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}${sep}${key}` : key;
    const value = obj[key];

    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      if (Object.keys(value).length > 0) {
        Object.assign(result, flattenResource(value, fullKey));
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (item !== null && typeof item === 'object') {
          Object.assign(result, flattenResource(item, `${fullKey}[${idx}]`));
        } else {
          result[`${fullKey}[${idx}]`] = item;
        }
      });
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

function parse(content, filePath) {
  const warnings = [];

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');

  let documents;
  try {
    documents = yaml.loadAll(source);
  } catch (err) {
    throw new Error(`Invalid Kubernetes YAML: ${err.message}`);
  }

  const config = {};
  let resourceCount = 0;

  for (const doc of documents) {
    if (!doc || typeof doc !== 'object') continue;
    resourceCount++;

    const kind = doc.kind || 'Unknown';
    const name = doc.metadata?.name || `resource-${resourceCount}`;
    const apiVersion = doc.apiVersion || '';

    const prefix = [apiVersion, kind, name].filter(Boolean).join('.').toLowerCase();

    const spec = doc.spec || {};
    const flatSpec = flattenResource(spec, prefix);

    Object.assign(config, flatSpec);

    if (doc.data && typeof doc.data === 'object') {
      for (const [dataKey, dataValue] of Object.entries(doc.data)) {
        config[`${prefix}.data.${dataKey}`] = dataValue;
      }
    }
  }

  if (resourceCount === 0) {
    warnings.push('No Kubernetes resources found in the file');
  }

  return { config, warnings };
}

module.exports = {
  name: 'kubernetes',
  supportedExtensions: ['.yaml', '.yml'],
  supportedMimes: [],
  detect(content, filePath) {
    if (!filePath) return false;
    const name = filePath.toLowerCase();
    if (name.includes('kubernetes') || name.includes('k8s')) return true;
    if (content && typeof content === 'string') {
      return content.includes('apiVersion:') && (content.includes('kind:') || content.includes('Kind:'));
    }
    return false;
  },
  parse,
};

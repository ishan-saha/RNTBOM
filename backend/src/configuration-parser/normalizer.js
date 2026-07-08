function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;

  const str = String(value).trim();

  if (str === '') return null;

  const numberValue = Number(str);
  if (!isNaN(numberValue) && str !== '' && isFinite(numberValue)) {
    if (Number.isInteger(numberValue) && str.indexOf('.') === -1) {
      return numberValue;
    }
    return numberValue;
  }

  const lower = str.toLowerCase();
  if (lower === 'true' || lower === 'yes' || lower === 'on' || lower === 'enabled' || lower === '1') {
    return true;
  }
  if (lower === 'false' || lower === 'no' || lower === 'off' || lower === 'disabled' || lower === '0') {
    return false;
  }

  return str;
}

function flattenObject(obj, prefix, separator) {
  const result = {};
  const sep = separator || '.';

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}${sep}${key}` : key;
    const value = obj[key];

    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      if (Object.keys(value).length === 0) {
        result[fullKey] = {};
      } else {
        Object.assign(result, flattenObject(value, fullKey, sep));
      }
    } else if (Array.isArray(value)) {
      result[fullKey] = value.map(v => {
        if (v !== null && typeof v === 'object') {
          return flattenObject(v, '', sep);
        }
        return normalizeValue(v);
      });
    } else {
      result[fullKey] = normalizeValue(value);
    }
  }

  return result;
}

function normalizeConfiguration(rawConfig) {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return {};
  }

  if (Array.isArray(rawConfig)) {
    const merged = {};
    for (const item of rawConfig) {
      if (item && typeof item === 'object') {
        Object.assign(merged, flattenObject(item, '', '.'));
      }
    }
    return merged;
  }

  return flattenObject(rawConfig, '', '.');
}

module.exports = { normalizeValue, flattenObject, normalizeConfiguration };

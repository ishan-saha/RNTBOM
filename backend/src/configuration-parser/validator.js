function validateConfiguration(config, warnings) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { config: {}, warnings: warnings || [] };
  }

  const result = {};
  const w = warnings || [];
  const seen = {};

  for (const key of Object.keys(config)) {
    const lowerKey = key.toLowerCase();

    if (seen[lowerKey] !== undefined) {
      w.push(`Duplicate key "${key}" — using last value`);
    }
    seen[lowerKey] = true;

    result[key] = config[key];
  }

  return { config: result, warnings: w };
}

module.exports = { validateConfiguration };

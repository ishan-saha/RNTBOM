const { loadRules } = require('./ruleLoader');
const { preprocessRules } = require('./preprocessor');
const { evaluateRule } = require('./ruleEvaluator');
const { buildResult, calculateSummary } = require('./resultBuilder');

async function runScan(benchmarkId, config, parsedConfigurationId) {
  const rules = await loadRules(benchmarkId);

  if (!rules || rules.length === 0) {
    throw new Error(`No rules found for benchmark "${benchmarkId}"`);
  }

  const processed = preprocessRules(rules);

  const scannedAt = new Date();
  const results = [];

  for (const rule of processed.valid) {
    const evaluation = evaluateRule(rule, config, parsedConfigurationId);
    const result = buildResult(rule, evaluation, scannedAt);
    results.push(result);
  }

  for (const rule of processed.manual) {
    const evaluation = { status: 'manual', actual: null, reason: 'Manual assessment' };
    const result = buildResult(rule, evaluation, scannedAt);
    results.push(result);
  }

  for (const skipped of processed.skipped) {
    const rule = rules.find(r => r.ruleId === skipped.ruleId);
    if (rule) {
      const evaluation = { status: 'skipped', actual: null, reason: skipped.reason };
      const result = buildResult(rule, evaluation, scannedAt);
      results.push(result);
    }
  }

  const summary = calculateSummary(results);

  return { results, summary };
}

module.exports = { runScan };

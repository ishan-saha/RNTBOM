const { loadRules } = require('./ruleLoader');
const { buildResult, calculateSummary } = require('./resultBuilder');
const { aiEvaluateRules } = require('../services/ai/aiService');
const { getBenchmark } = require('../services/benchmarkService');

async function runScan(benchmarkId, config) {
  const rules = await loadRules(benchmarkId);

  if (!rules || rules.length === 0) {
    throw new Error(`No rules found for benchmark "${benchmarkId}"`);
  }

  let benchmarkName = 'Unknown';
  let benchmarkVersion = 'N/A';
  try {
    const bm = await getBenchmark(benchmarkId);
    if (bm) {
      benchmarkName = bm.name || benchmarkName;
      benchmarkVersion = bm.version || benchmarkVersion;
    }
  } catch { }

  const scannedAt = new Date();

  const aiResults = await aiEvaluateRules(benchmarkName, benchmarkVersion, rules, config);

  const resultMap = {};
  for (const ai of aiResults) {
    resultMap[ai.ruleId] = ai;
  }

  const results = rules.map(rule => {
    const ai = resultMap[rule.ruleId] || {
      status: 'fail',
      reason: 'No AI evaluation returned for this rule',
      confidence: null,
      risk: null,
      recommendation: rule.remediation || '',
    };
    return buildResult(rule, ai, scannedAt);
  });

  const summary = calculateSummary(results);

  return { results, summary };
}

module.exports = { runScan };
const BenchmarkRule = require('../models/BenchmarkRule');

async function loadRules(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('benchmarkId is required');
  }

  const rules = await BenchmarkRule.find({ benchmarkId })
    .sort({ ruleId: 1 })
    .lean();

  return rules;
}

module.exports = { loadRules };

function buildResult(rule, evaluation, scannedAt) {
  const comparison = rule.comparison || {};

  return {
    benchmarkId: String(rule.benchmarkId),
    ruleId: rule.ruleId,
    title: rule.title || '',
    categoryId: rule.categoryId || '',
    categoryTitle: rule.categoryTitle || '',
    severity: rule.severity || '',
    pageNumber: rule.pageNumber || null,
    status: rule.status?.assessment || '',
    result: evaluation.status,
    expected: evaluation.expected !== undefined ? evaluation.expected : (comparison.expectedValue ?? null),
    actual: evaluation.actual !== undefined ? evaluation.actual : null,
    comparisonKey: comparison.key || null,
    reason: evaluation.reason || '',
    remediation: rule.remediation || '',
    audit: rule.audit || '',
    confidence: evaluation.confidence ?? null,
    risk: evaluation.risk || null,
    recommendation: evaluation.recommendation || '',
    scannedAt: scannedAt || new Date(),
  };
}

function calculateSummary(results) {
  const counts = {
    total: results.length,
    passed: 0,
    failed: 0,
    warning: 0,
  };

  for (const r of results) {
    switch (r.result) {
      case 'pass': counts.passed++; break;
      case 'fail': counts.failed++; break;
      case 'warning': counts.warning++; break;
    }
  }

  const evaluated = counts.passed + counts.failed;
  const compliancePercentage = evaluated > 0
    ? Number(((counts.passed / evaluated) * 100).toFixed(2))
    : 0;

  return {
    ...counts,
    compliancePercentage,
  };
}

module.exports = { buildResult, calculateSummary };
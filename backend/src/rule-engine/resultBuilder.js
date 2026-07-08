function buildResult(rule, evaluation, scannedAt) {
  const comparison = rule.comparison || {};
  const conditions = comparison.conditions;
  const isMultiCondition = conditions && Array.isArray(conditions) && conditions.length > 0;

  const result = {
    benchmarkId: String(rule.benchmarkId),
    ruleId: rule.ruleId,
    title: rule.title || '',
    categoryId: rule.categoryId || '',
    categoryTitle: rule.categoryTitle || '',
    severity: rule.severity || '',
    pageNumber: rule.pageNumber || null,
    status: rule.status?.assessment || '',
    result: evaluation.status,
    expected: comparison.expectedValue ?? null,
    actual: evaluation.actual ?? null,
    comparisonOperator: comparison.operator || null,
    comparisonKey: comparison.key || null,
    reason: evaluation.reason || '',
    remediation: rule.remediation || '',
    audit: rule.audit || '',
    scannedAt: scannedAt || new Date(),
  };

  if (isMultiCondition) {
    result.expected = evaluation.expectedSummary || null;
    result.comparisonOperator = comparison.logic || 'AND';
    result.comparisonKey = 'multi-condition';
    if (evaluation.conditions) {
      result.conditions = evaluation.conditions;
    }
  }

  return result;
}

function calculateSummary(results) {
  const counts = {
    total: results.length,
    passed: 0,
    failed: 0,
    manual: 0,
    skipped: 0,
    notFound: 0,
  };

  for (const r of results) {
    switch (r.result) {
      case 'pass': counts.passed++; break;
      case 'fail': counts.failed++; break;
      case 'manual': counts.manual++; break;
      case 'skipped': counts.skipped++; break;
      case 'not_found': counts.notFound++; break;
    }
  }

  const evaluated = counts.passed + counts.failed;
  const totalEvaluable = counts.total - counts.manual - counts.skipped;
  const compliancePercentage = totalEvaluable > 0
    ? Number(((counts.passed / totalEvaluable) * 100).toFixed(2))
    : 0;

  return {
    ...counts,
    compliancePercentage,
  };
}

module.exports = { buildResult, calculateSummary };

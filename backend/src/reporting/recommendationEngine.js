const SEVERITY_RANK = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };

function severityRank(sev) {
  const key = (sev || '').toLowerCase();
  return SEVERITY_RANK[key] !== undefined ? SEVERITY_RANK[key] : 99;
}

function generateRecommendations(results) {
  const failed = results.filter(r => r.result === 'fail');
  const warnings = results.filter(r => r.result === 'warning');

  const recommendations = failed
    .map(r => ({
      ruleId: r.ruleId,
      title: r.title,
      reason: r.reason,
      expected: r.expected,
      actual: r.actual,
      remediation: r.remediation,
      recommendation: r.recommendation,
      risk: r.risk,
      confidence: r.confidence,
      pageNumber: r.pageNumber,
      categoryId: r.categoryId,
      categoryTitle: r.categoryTitle,
      severity: r.severity,
    }))
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const warningItems = warnings.map(r => ({
    ruleId: r.ruleId,
    title: r.title,
    reason: r.reason,
    expected: r.expected,
    actual: r.actual,
    remediation: r.remediation,
    recommendation: r.recommendation,
    pageNumber: r.pageNumber,
    categoryId: r.categoryId,
    categoryTitle: r.categoryTitle,
    severity: r.severity,
  }));

  return { recommendations, warningItems };
}

module.exports = { generateRecommendations };
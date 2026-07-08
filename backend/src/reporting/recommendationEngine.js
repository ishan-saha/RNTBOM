const SEVERITY_RANK = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };

function severityRank(sev) {
  const key = (sev || '').toLowerCase();
  return SEVERITY_RANK[key] !== undefined ? SEVERITY_RANK[key] : 99;
}

function generateRecommendations(results) {
  const failed = results.filter(r => r.result === 'fail');
  const manual = results.filter(r => r.result === 'manual');
  const missing = results.filter(r => r.result === 'not_found');

  const recommendations = failed
    .map(r => ({
      ruleId: r.ruleId,
      title: r.title,
      reason: r.reason,
      expected: r.expected,
      actual: r.actual,
      remediation: r.remediation,
      pageNumber: r.pageNumber,
      categoryId: r.categoryId,
      categoryTitle: r.categoryTitle,
      severity: r.severity,
    }))
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const manualChecks = manual.map(r => ({
    ruleId: r.ruleId,
    title: r.title,
    reason: r.reason || 'Requires manual assessment',
    pageNumber: r.pageNumber,
    categoryId: r.categoryId,
    categoryTitle: r.categoryTitle,
    severity: r.severity,
    audit: r.audit,
    remediation: r.remediation,
  }));

  const missingConfigurations = missing.map(r => ({
    ruleId: r.ruleId,
    title: r.title,
    key: r.comparisonKey,
    expected: r.expected,
    pageNumber: r.pageNumber,
    categoryId: r.categoryId,
    categoryTitle: r.categoryTitle,
    severity: r.severity,
    remediation: r.remediation,
  }));

  return { recommendations, manualChecks, missingConfigurations };
}

module.exports = { generateRecommendations };

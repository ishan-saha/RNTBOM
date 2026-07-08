function buildStatistics(results) {
  const counts = {
    totalRules: results.length,
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
  const totalEvaluable = counts.totalRules - counts.manual - counts.skipped;
  const compliancePercentage = totalEvaluable > 0
    ? Number(((counts.passed / totalEvaluable) * 100).toFixed(2))
    : 0;

  const failurePercentage = totalEvaluable > 0
    ? Number(((counts.failed / totalEvaluable) * 100).toFixed(2))
    : 0;

  const automated = counts.passed + counts.failed + counts.notFound;
  const automationPercentage = counts.totalRules > 0
    ? Number(((automated / counts.totalRules) * 100).toFixed(2))
    : 0;

  return {
    ...counts,
    evaluated,
    compliancePercentage,
    failurePercentage,
    automationPercentage,
  };
}

module.exports = { buildStatistics };

function buildStatistics(results) {
  const counts = {
    totalRules: results.length,
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

  const failurePercentage = evaluated > 0
    ? Number(((counts.failed / evaluated) * 100).toFixed(2))
    : 0;

  const warningPercentage = counts.totalRules > 0
    ? Number(((counts.warning / counts.totalRules) * 100).toFixed(2))
    : 0;

  return {
    ...counts,
    evaluated,
    compliancePercentage,
    failurePercentage,
    warningPercentage,
  };
}

module.exports = { buildStatistics };
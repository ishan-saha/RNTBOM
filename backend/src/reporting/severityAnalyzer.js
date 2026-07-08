const SEVERITY_ORDER = ['L1', 'L2'];

function analyzeSeverity(results) {
  const severityMap = {};

  for (const r of results) {
    const sev = r.severity || 'unspecified';

    if (!severityMap[sev]) {
      severityMap[sev] = {
        severity: sev,
        total: 0,
        passed: 0,
        failed: 0,
        manual: 0,
        skipped: 0,
        notFound: 0,
        compliance: 0,
      };
    }

    severityMap[sev].total++;

    switch (r.result) {
      case 'pass': severityMap[sev].passed++; break;
      case 'fail': severityMap[sev].failed++; break;
      case 'manual': severityMap[sev].manual++; break;
      case 'skipped': severityMap[sev].skipped++; break;
      case 'not_found': severityMap[sev].notFound++; break;
    }
  }

  for (const s of Object.values(severityMap)) {
    const evaluable = s.total - s.manual - s.skipped;
    s.compliance = evaluable > 0
      ? Number(((s.passed / evaluable) * 100).toFixed(2))
      : 0;
  }

  const sorted = {};
  for (const order of SEVERITY_ORDER) {
    if (severityMap[order]) {
      sorted[order] = severityMap[order];
    }
  }
  for (const [key, val] of Object.entries(severityMap)) {
    if (!sorted[key]) {
      sorted[key] = val;
    }
  }

  return sorted;
}

module.exports = { analyzeSeverity };

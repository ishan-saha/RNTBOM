const { ZipArchive } = require('archiver');

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCSV(rows) {
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
}

async function generateCSVZip(report) {
  const { summary, categories, severity, recommendations, manualChecks, missingConfigurations, metadata } = report;

  const buffers = [];
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on('data', d => buffers.push(d));

  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Rules', summary?.totalRules || summary?.total || 0],
    ['Passed', summary?.passed || 0],
    ['Failed', summary?.failed || 0],
    ['Manual', summary?.manual || 0],
    ['Skipped', summary?.skipped || 0],
    ['Not Found', summary?.notFound || 0],
    ['Compliance %', summary?.compliancePercentage || 0],
    ['Failure %', summary?.failurePercentage || 0],
    ['Automation %', summary?.automationPercentage || 0],
    ['Benchmark', metadata?.benchmarkName || '-'],
    ['Version', metadata?.benchmarkVersion || '-'],
    ['Scan Date', new Date(metadata?.scannedAt || metadata?.createdAt).toISOString()],
  ];
  archive.append(rowsToCSV(summaryRows), { name: 'summary.csv' });

  const catRows = [['Category', 'Total', 'Passed', 'Failed', 'Manual', 'Skipped', 'Not Found', 'Compliance %']];
  if (categories) {
    Object.values(categories).forEach(c => {
      catRows.push([c.categoryTitle || c.categoryId, c.total, c.passed, c.failed, c.manual, c.skipped, c.notFound, c.compliance]);
    });
  }
  archive.append(rowsToCSV(catRows), { name: 'categories.csv' });

  const sevRows = [['Severity', 'Total', 'Passed', 'Failed', 'Manual', 'Skipped', 'Not Found', 'Compliance %']];
  if (severity) {
    Object.values(severity).forEach(s => {
      sevRows.push([s.severity, s.total, s.passed, s.failed, s.manual, s.skipped, s.notFound, s.compliance]);
    });
  }
  archive.append(rowsToCSV(sevRows), { name: 'severity.csv' });

  const recRows = [['Rule ID', 'Title', 'Severity', 'Expected', 'Actual', 'Reason', 'Remediation', 'Category']];
  if (recommendations) {
    recommendations.forEach(r => {
      recRows.push([r.ruleId, r.title, r.severity, r.expected, r.actual, r.reason, r.remediation, r.categoryTitle]);
    });
  }
  archive.append(rowsToCSV(recRows), { name: 'recommendations.csv' });

  const manualRows = [['Rule ID', 'Title', 'Severity', 'Audit', 'Remediation']];
  if (manualChecks) {
    manualChecks.forEach(m => {
      manualRows.push([m.ruleId, m.title, m.severity, m.audit, m.remediation]);
    });
  }
  archive.append(rowsToCSV(manualRows), { name: 'manual_checks.csv' });

  const missingRows = [['Rule ID', 'Title', 'Key', 'Expected', 'Severity', 'Remediation']];
  if (missingConfigurations) {
    missingConfigurations.forEach(m => {
      missingRows.push([m.ruleId, m.title, m.key, m.expected, m.severity, m.remediation]);
    });
  }
  archive.append(rowsToCSV(missingRows), { name: 'missing_configurations.csv' });

  archive.finalize();

  return new Promise((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(buffers)));
    archive.on('error', reject);
  });
}

module.exports = { generateCSVZip };

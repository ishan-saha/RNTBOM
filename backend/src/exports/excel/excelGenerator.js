const ExcelJS = require('exceljs');

async function generateExcel(report) {
  const { summary, categories, severity, recommendations, manualChecks, missingConfigurations, metadata } = report;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Compliance Scanner';
  wb.created = new Date();

  function styleHeader(ws, rowCount = 1) {
    for (let r = 1; r <= rowCount; r++) {
      const row = ws.getRow(r);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      row.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  function addBorder(ws, colCount, rowCount) {
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
    }
  }

  const wsSummary = wb.addWorksheet('Summary');
  const summaryHeaders = ['Metric', 'Value'];
  wsSummary.addRow(summaryHeaders);
  const summaryData = [
    ['Total Rules', summary?.totalRules || summary?.total || 0],
    ['Passed', summary?.passed || 0],
    ['Failed', summary?.failed || 0],
    ['Manual', summary?.manual || 0],
    ['Skipped', summary?.skipped || 0],
    ['Not Found', summary?.notFound || 0],
    ['Compliance Percentage', `${summary?.compliancePercentage || 0}%`],
    ['Failure Percentage', `${summary?.failurePercentage || 0}%`],
    ['Automation Percentage', `${summary?.automationPercentage || 0}%`],
    ['Benchmark', metadata?.benchmarkName || '-'],
    ['Version', metadata?.benchmarkVersion || '-'],
    ['Scan Date', new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleString()],
  ];
  summaryData.forEach(r => wsSummary.addRow(r));
  styleHeader(wsSummary);
  wsSummary.getColumn(1).width = 25;
  wsSummary.getColumn(2).width = 20;
  addBorder(wsSummary, 2, summaryData.length + 1);

  const wsCat = wb.addWorksheet('Category Analysis');
  const catHeaders = ['Category', 'Total', 'Passed', 'Failed', 'Manual', 'Skipped', 'Not Found', 'Compliance %'];
  wsCat.addRow(catHeaders);
  if (categories) {
    Object.values(categories).forEach(c => {
      wsCat.addRow([c.categoryTitle || c.categoryId, c.total, c.passed, c.failed, c.manual, c.skipped, c.notFound, c.compliance]);
    });
  }
  styleHeader(wsCat);
  wsCat.columns = catHeaders.map(h => ({ width: 18 }));
  addBorder(wsCat, 8, (categories ? Object.keys(categories).length : 0) + 1);

  const wsSev = wb.addWorksheet('Severity Analysis');
  const sevHeaders = ['Severity', 'Total', 'Passed', 'Failed', 'Manual', 'Skipped', 'Not Found', 'Compliance %'];
  wsSev.addRow(sevHeaders);
  if (severity) {
    Object.values(severity).forEach(s => {
      wsSev.addRow([s.severity, s.total, s.passed, s.failed, s.manual, s.skipped, s.notFound, s.compliance]);
    });
  }
  styleHeader(wsSev);
  wsSev.columns = sevHeaders.map(h => ({ width: 18 }));
  addBorder(wsSev, 8, (severity ? Object.keys(severity).length : 0) + 1);

  const wsRec = wb.addWorksheet('Recommendations');
  const recHeaders = ['Rule ID', 'Title', 'Severity', 'Expected', 'Actual', 'Reason', 'Remediation', 'Category'];
  wsRec.addRow(recHeaders);
  if (recommendations) {
    recommendations.forEach(r => {
      wsRec.addRow([r.ruleId, r.title, r.severity, r.expected != null ? String(r.expected) : '', r.actual != null ? String(r.actual) : '', r.reason || '', r.remediation || '', r.categoryTitle || '']);
    });
  }
  styleHeader(wsRec);
  wsRec.columns = recHeaders.map(h => ({ width: 20 }));
  addBorder(wsRec, 8, (recommendations ? recommendations.length : 0) + 1);

  const wsManual = wb.addWorksheet('Manual Checks');
  const manualHeaders = ['Rule ID', 'Title', 'Severity', 'Audit', 'Remediation'];
  wsManual.addRow(manualHeaders);
  if (manualChecks) {
    manualChecks.forEach(m => {
      wsManual.addRow([m.ruleId, m.title, m.severity, m.audit || '', m.remediation || '']);
    });
  }
  styleHeader(wsManual);
  wsManual.columns = manualHeaders.map(h => ({ width: 22 }));
  addBorder(wsManual, 5, (manualChecks ? manualChecks.length : 0) + 1);

  const wsMissing = wb.addWorksheet('Missing Configurations');
  const missingHeaders = ['Rule ID', 'Title', 'Key', 'Expected', 'Severity', 'Remediation'];
  wsMissing.addRow(missingHeaders);
  if (missingConfigurations) {
    missingConfigurations.forEach(m => {
      wsMissing.addRow([m.ruleId, m.title, m.key || '', m.expected != null ? String(m.expected) : '', m.severity || '', m.remediation || '']);
    });
  }
  styleHeader(wsMissing);
  wsMissing.columns = missingHeaders.map(h => ({ width: 22 }));
  addBorder(wsMissing, 6, (missingConfigurations ? missingConfigurations.length : 0) + 1);

  return await wb.xlsx.writeBuffer();
}

module.exports = { generateExcel };

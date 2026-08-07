const ExcelJS = require('exceljs');

async function generateExcel(report) {
  const { summary, categories, severity, recommendations, metadata } = report;
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
    ['Warnings', summary?.warning || 0],
    ['Compliance Percentage', `${summary?.compliancePercentage || 0}%`],
    ['Failure Percentage', `${summary?.failurePercentage || 0}%`],
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
  const catHeaders = ['Category', 'Total', 'Passed', 'Failed', 'Warnings', 'Compliance %'];
  wsCat.addRow(catHeaders);
  if (categories) {
    Object.values(categories).forEach(c => {
      wsCat.addRow([c.categoryTitle || c.categoryId, c.total, c.passed, c.failed, c.warning || 0, c.compliance]);
    });
  }
  styleHeader(wsCat);
  wsCat.columns = catHeaders.map(h => ({ width: 18 }));
  addBorder(wsCat, 6, (categories ? Object.keys(categories).length : 0) + 1);

  const wsSev = wb.addWorksheet('Severity Analysis');
  const sevHeaders = ['Severity', 'Total', 'Passed', 'Failed', 'Warnings', 'Compliance %'];
  wsSev.addRow(sevHeaders);
  if (severity) {
    Object.values(severity).forEach(s => {
      wsSev.addRow([s.severity, s.total, s.passed, s.failed, s.warning || 0, s.compliance]);
    });
  }
  styleHeader(wsSev);
  wsSev.columns = sevHeaders.map(h => ({ width: 18 }));
  addBorder(wsSev, 6, (severity ? Object.keys(severity).length : 0) + 1);

  const wsRec = wb.addWorksheet('Recommendations');
  const recHeaders = ['Rule ID', 'Title', 'Severity', 'Expected', 'Actual', 'Reason', 'Risk', 'Recommendation'];
  wsRec.addRow(recHeaders);
  if (recommendations) {
    recommendations.forEach(r => {
      wsRec.addRow([r.ruleId, r.title, r.severity, r.expected != null ? String(r.expected) : '', r.actual != null ? String(r.actual) : '', r.reason || '', r.risk || '', r.recommendation || r.remediation || '']);
    });
  }
  styleHeader(wsRec);
  wsRec.columns = recHeaders.map(h => ({ width: 20 }));
  addBorder(wsRec, 8, (recommendations ? recommendations.length : 0) + 1);

  return await wb.xlsx.writeBuffer();
}

module.exports = { generateExcel };
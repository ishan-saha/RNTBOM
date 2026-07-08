const { renderGauge, renderBarChart, renderPieChart, renderLineChart } = require('../../utils/chartRenderer');

function complianceCharts(doc, report, branding) {
  const { summary, categories, severity, trend } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Compliance Charts', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  renderGauge(doc, 60, 100, 70, summary?.compliancePercentage || 0, primaryColor);

  const catData = categories ? Object.values(categories).slice(0, 8).map(c => ({
    label: c.categoryTitle || c.categoryId,
    passed: c.passed,
    failed: c.failed,
  })) : [];

  if (catData.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0');
    doc.text('Category Distribution', 280, 100);
    renderBarChart(doc, 270, 115, 240, 150, catData);
  }

  const sevData = severity ? Object.values(severity).map(s => ({
    name: s.severity,
    value: s.total,
  })) : [];

  if (sevData.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0');
    doc.text('Severity Distribution', 60, 300);
    renderPieChart(doc, 120, 380, 65, sevData);

    let sy = 320;
    sevData.forEach(s => {
      const sc = { L1: '#ef4444', L2: '#f59e0b', critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' };
      const color = sc[s.name] || '#6366f1';
      doc.rect(290, sy, 10, 10).fill(color);
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8');
      doc.text(`${s.name}: ${s.value} rules`, 308, sy, { width: 150 });
      sy += 18;
    });
  }

  if (trend && trend.history && trend.history.length > 1) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0');
    doc.text('Compliance Trend', 60, 490);
    renderLineChart(doc, 60, 510, 460, 140, trend.history);
  }

  doc.addPage();
}

module.exports = { complianceCharts };

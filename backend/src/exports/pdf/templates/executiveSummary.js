function executiveSummary(doc, report, branding) {
  const { summary, metadata, trend } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Executive Summary', 60, 50);

  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8');
  doc.text(
    `This report presents the compliance scan results for "${metadata?.benchmarkName || 'Unknown Benchmark'}" ` +
    `conducted on ${new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleDateString()}. ` +
    `The scan evaluated ${summary?.totalRules || summary?.total || 0} configuration rules against the uploaded system configuration.`,
    60, 90, { width: 480 }
  );

  let y = 160;
  const col1 = 60;
  const col2 = 280;
  const rowH = 22;

  const fields = [
    ['Compliance Score', `${summary?.compliancePercentage || 0}%`, summary?.compliancePercentage >= 80 ? '#22c55e' : summary?.compliancePercentage >= 60 ? '#f59e0b' : '#ef4444'],
    ['Total Rules', String(summary?.totalRules || summary?.total || 0), '#e2e8f0'],
    ['Passed', String(summary?.passed || 0), '#22c55e'],
    ['Failed', String(summary?.failed || 0), '#ef4444'],
    ['Warnings', String(summary?.warning || 0), '#f59e0b'],
    ['Failure Rate', `${summary?.failurePercentage || 0}%`, '#ef4444'],
  ];

  fields.forEach(([label, value, color], i) => {
    const col = i < 5 ? col1 : col2;
    const row = i < 5 ? i : i - 5;
    const ry = y + row * rowH;

    doc.rect(col, ry, 190, 18).fill('#1a1a2e');
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(label, col + 8, ry + 4);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(color).text(value, col + 140, ry + 3);
  });

  if (trend && trend.previousScore !== null) {
    y += 140;
    doc.moveTo(60, y).lineTo(520, y).stroke('#1e1e2e');
    y += 20;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0');
    doc.text('Compliance Trend', 60, y);
    y += 20;
    doc.fontSize(10).font('Helvetica').fillColor('#94a3b8');
    doc.text(`Previous: ${trend.previousScore}%`, 60, y);
    doc.text(`Current: ${trend.currentScore}%`, 200, y);
    const diffColor = trend.difference > 0 ? '#22c55e' : trend.difference < 0 ? '#ef4444' : '#94a3b8';
    const arrow = trend.difference > 0 ? '↑' : trend.difference < 0 ? '↓' : '→';
    doc.fontSize(10).font('Helvetica-Bold').fillColor(diffColor);
    doc.text(`${arrow} ${Math.abs(trend.difference).toFixed(2)}%`, 340, y);
  }

  const risk = summary?.compliancePercentage >= 80 ? 'Low Risk' : summary?.compliancePercentage >= 60 ? 'Medium Risk' : 'High Risk';
  const riskColor = summary?.compliancePercentage >= 80 ? '#22c55e' : summary?.compliancePercentage >= 60 ? '#f59e0b' : '#ef4444';

  doc.rect(60, y + 40, 460, 30).fill('#1a1a2e');
  doc.fontSize(14).font('Helvetica-Bold').fillColor(riskColor);
  doc.text(`Overall Risk Assessment: ${risk}`, 75, y + 50);

  doc.addPage();
}

module.exports = { executiveSummary };

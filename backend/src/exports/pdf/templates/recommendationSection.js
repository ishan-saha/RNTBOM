function recommendationSection(doc, report, branding) {
  const { recommendations } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Failed Recommendations', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
  doc.text(`Total failed rules: ${recommendations?.length || 0}`, 60, 85);

  if (!recommendations || recommendations.length === 0) {
    doc.fontSize(12).font('Helvetica').fillColor('#22c55e').text('No failed rules — all checks passed.', 60, 120);
    doc.addPage();
    return;
  }

  const cols = [30, 90, 160, 70, 70];
  const headers = ['Rule ID', 'Title', 'Expected', 'Actual', 'Severity'];
  let y = 105;

  doc.rect(60, y, 460, 20).fill(primaryColor);
  let hx = 65;
  headers.forEach((h, i) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff').text(h, hx, y + 5, { width: cols[i], align: 'center' });
    hx += cols[i];
  });
  y += 25;

  recommendations.slice(0, 50).forEach((rec) => {
    if (y > 720) {
      doc.addPage();
      y = 60;
      doc.rect(60, y, 460, 18).fill(primaryColor);
      hx = 65;
      headers.forEach((h, i) => {
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff').text(h, hx, y + 4, { width: cols[i], align: 'center' });
        hx += cols[i];
      });
      y += 22;
    }

    const bgColor = y % 40 === 0 ? '#1a1a2e' : '#151525';
    doc.rect(60, y - 4, 460, 18).fill(bgColor);

    doc.fontSize(7).font('Helvetica').fillColor('#e2e8f0');
    doc.text(rec.ruleId || '', 65, y, { width: 28 });
    doc.text(rec.title?.length > 25 ? rec.title.slice(0, 25) + '...' : rec.title || '', 95, y, { width: 85 });
    doc.text(rec.expected != null ? String(rec.expected).slice(0, 20) : '-', 185, y, { width: 65 });
    doc.text(rec.actual != null ? String(rec.actual).slice(0, 20) : '-', 250, y, { width: 65 });

    const sv = rec.severity || '';
    const sc = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8', L1: '#ef4444', L2: '#f59e0b' };
    doc.fontSize(7).font('Helvetica-Bold').fillColor(sc[sv.toLowerCase()] || '#94a3b8');
    doc.text(sv, 320, y, { width: 50 });

    y += 18;
  });

  if (recommendations.length > 50) {
    doc.fontSize(9).font('Helvetica').fillColor('#f59e0b');
    doc.text(`Showing 50 of ${recommendations.length} failed rules. View the full report in the application.`, 60, y + 10, { width: 460 });
  }

  doc.addPage();
}

module.exports = { recommendationSection };

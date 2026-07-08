function severitySection(doc, report, branding) {
  const { severity } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Severity Analysis', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  const sevValues = severity ? Object.values(severity) : [];
  const severityColors = {
    critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8',
    L1: '#ef4444', L2: '#f59e0b',
  };

  let y = 100;
  sevValues.forEach((sev) => {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }

    const color = severityColors[sev.severity] || '#6366f1';
    doc.rect(60, y, 460, 50).fill('#1a1a2e');
    doc.rect(60, y, 6, 50).fill(color);

    doc.fontSize(12).font('Helvetica-Bold').fillColor(color);
    doc.text(sev.severity, 78, y + 6, { width: 100 });

    const cols = [
      ['Total', sev.total],
      ['Passed', sev.passed],
      ['Failed', sev.failed],
      ['Compliance', `${sev.compliance}%`],
    ];

    cols.forEach(([label, value], i) => {
      const cx = 280 + i * 55;
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(label, cx, y + 6, { width: 50, align: 'center' });
      const vc = label === 'Failed' && value > 0 ? '#ef4444' : label === 'Compliance' ? (sev.compliance >= 80 ? '#22c55e' : sev.compliance >= 60 ? '#f59e0b' : '#ef4444') : '#e2e8f0';
      doc.fontSize(12).font('Helvetica-Bold').fillColor(vc).text(String(value), cx, y + 22, { width: 50, align: 'center' });
    });

    y += 60;
  });

  doc.addPage();
}

module.exports = { severitySection };

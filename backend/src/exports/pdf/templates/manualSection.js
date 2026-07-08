function manualSection(doc, report, branding) {
  const { manualChecks } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Manual Checks', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  if (!manualChecks || manualChecks.length === 0) {
    doc.fontSize(12).font('Helvetica').fillColor('#22c55e').text('No manual checks required.', 60, 120);
    doc.addPage();
    return;
  }

  doc.fontSize(9).font('Helvetica').fillColor('#f59e0b');
  doc.text(`${manualChecks.length} rule(s) require manual assessment.`, 60, 90);

  const cols = [80, 250, 130];
  const headers = ['Rule ID', 'Title', 'Severity'];
  let y = 115;

  doc.rect(60, y, 460, 20).fill(primaryColor);
  let hx = 65;
  headers.forEach((h, i) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff').text(h, hx, y + 5, { width: cols[i] });
    hx += cols[i];
  });
  y += 25;

  manualChecks.forEach((mc) => {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    const bgColor = '#1a1a2e';
    doc.rect(60, y - 4, 460, 18).fill(bgColor);

    doc.fontSize(8).font('Helvetica').fillColor('#e2e8f0');
    doc.text(mc.ruleId || '', 65, y, { width: 75 });
    doc.text(mc.title?.length > 40 ? mc.title.slice(0, 40) + '...' : mc.title || '', 145, y, { width: 245 });
    doc.text(mc.severity || '-', 395, y, { width: 120 });

    y += 18;
  });

  doc.addPage();
}

module.exports = { manualSection };

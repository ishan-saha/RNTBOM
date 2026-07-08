function missingConfigurationSection(doc, report, branding) {
  const { missingConfigurations } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Missing Configurations', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  if (!missingConfigurations || missingConfigurations.length === 0) {
    doc.fontSize(12).font('Helvetica').fillColor('#22c55e').text('All required configuration keys are present.', 60, 120);
    doc.addPage();
    return;
  }

  doc.fontSize(9).font('Helvetica').fillColor('#3b82f6');
  doc.text(`${missingConfigurations.length} configuration key(s) not found in uploaded files.`, 60, 90);

  const cols = [80, 200, 200];
  const headers = ['Rule ID', 'Expected Key', 'Remediation'];
  let y = 115;

  doc.rect(60, y, 460, 20).fill(primaryColor);
  let hx = 65;
  headers.forEach((h, i) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff').text(h, hx, y + 5, { width: cols[i] });
    hx += cols[i];
  });
  y += 25;

  missingConfigurations.forEach((mc) => {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    const bgColor = '#1a1a2e';
    doc.rect(60, y - 4, 460, 18).fill(bgColor);

    doc.fontSize(8).font('Helvetica').fillColor('#e2e8f0');
    doc.text(mc.ruleId || '', 65, y, { width: 75 });
    doc.fontSize(7).font('Courier').fillColor('#f59e0b');
    doc.text(mc.key || '-', 145, y, { width: 195 });
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
    doc.text(mc.remediation?.length > 40 ? mc.remediation.slice(0, 40) + '...' : mc.remediation || '-', 345, y, { width: 170 });

    y += 18;
  });

  doc.addPage();
}

module.exports = { missingConfigurationSection };

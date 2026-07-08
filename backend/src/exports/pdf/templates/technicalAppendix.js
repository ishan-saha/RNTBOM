function technicalAppendix(doc, report, branding) {
  const { metadata } = report;
  const { primaryColor, companyName } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Technical Appendix', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  let y = 100;
  const fields = [
    ['Application', companyName || 'Compliance Scanner'],
    ['Benchmark', metadata?.benchmarkName || '-'],
    ['Benchmark Version', metadata?.benchmarkVersion || '-'],
    ['Scan ID', metadata?.scanId || '-'],
    ['Configuration ID', metadata?.parsedConfigurationId || '-'],
    ['Scan Date', new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleString()],
    ['Total Rules Evaluated', String(metadata?.totalResults || 0)],
    ['Status', metadata?.status || '-'],
    ['Engine Version', '1.0.0'],
    ['Parser', 'CIS Benchmark Import v1'],
  ];

  fields.forEach(([label, value]) => {
    doc.rect(60, y, 200, 22).fill('#1a1a2e');
    doc.rect(260, y, 260, 22).fill('#151525');

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#94a3b8');
    doc.text(label, 68, y + 5, { width: 185 });
    doc.fontSize(9).font('Courier').fillColor('#e2e8f0');
    doc.text(value, 268, y + 5, { width: 245 });

    y += 24;
  });

  y += 30;
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
  doc.text(
    'This report was generated automatically by the Configuration Compliance Scanner. ' +
    'The results are based on the uploaded configuration files and the selected benchmark rules. ' +
    'For questions about this report, contact your system administrator.',
    60, y, { width: 460 }
  );
}

module.exports = { technicalAppendix };

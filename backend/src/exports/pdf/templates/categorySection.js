function categorySection(doc, report, branding) {
  const { categories } = report;
  const { primaryColor } = branding;

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text('Category Analysis', 60, 50);
  doc.moveTo(60, 72).lineTo(250, 72).stroke(primaryColor);

  const catValues = categories ? Object.values(categories) : [];

  let y = 100;
  catValues.forEach((cat) => {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }

    doc.rect(60, y, 460, 50).fill('#1a1a2e');
    doc.rect(60, y, 6, 50).fill(primaryColor);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#e2e8f0');
    doc.text(cat.categoryTitle || cat.categoryId, 78, y + 6, { width: 200 });

    const cols = [
      ['Total', cat.total],
      ['Passed', cat.passed],
      ['Failed', cat.failed],
      ['Compliance', `${cat.compliance}%`],
    ];

    cols.forEach(([label, value], i) => {
      const cx = 280 + i * 55;
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(label, cx, y + 6, { width: 50, align: 'center' });
      const vc = label === 'Failed' && value > 0 ? '#ef4444' : label === 'Compliance' ? (cat.compliance >= 80 ? '#22c55e' : cat.compliance >= 60 ? '#f59e0b' : '#ef4444') : '#e2e8f0';
      doc.fontSize(12).font('Helvetica-Bold').fillColor(vc).text(String(value), cx, y + 22, { width: 50, align: 'center' });
    });

    y += 60;
  });

  doc.addPage();
}

module.exports = { categorySection };

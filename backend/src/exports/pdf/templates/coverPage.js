function coverPage(doc, report, branding) {
  const { summary, metadata } = report;
  const { companyName, primaryColor, preparedBy, logoPath } = branding;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.rect(0, 0, pageWidth, pageHeight).fill('#0f0f1a');

  const barWidth = 6;
  doc.rect(0, 0, barWidth, pageHeight).fill(primaryColor);

  doc.rect(barWidth, pageHeight - 120, pageWidth, 120).fill(primaryColor);

  doc.fontSize(36).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('COMPLIANCE', 60, 180, { lineBreak: false });
  doc.text('REPORT', 60, 225);

  doc.fontSize(14).font('Helvetica').fillColor(primaryColor);
  doc.text('Configuration Compliance Scanner', 60, 280);

  doc.moveTo(60, 310).lineTo(300, 310).stroke(primaryColor);

  let y = 340;
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#e2e8f0');
  doc.text(metadata?.benchmarkName || 'Security Benchmark', 60, y);
  y += 28;
  doc.fontSize(12).font('Helvetica').fillColor('#94a3b8');
  doc.text(`Version: ${metadata?.benchmarkVersion || '-'}`, 60, y);
  y += 22;
  doc.text(`Scan Date: ${new Date(metadata?.scannedAt || metadata?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, y);
  y += 22;
  doc.text(`Compliance: ${summary?.compliancePercentage || 0}%`, 60, y);

  doc.fontSize(9).fillColor('#94a3b8');
  const footerY = pageHeight - 95;
  doc.text(`Prepared by: ${preparedBy}`, 60, footerY);
  doc.text(`© ${new Date().getFullYear()} ${companyName}`, 60, footerY + 14);

  doc.fontSize(8).fillColor(primaryColor).text('CONFIDENTIAL', pageWidth - 160, footerY, { width: 120, align: 'right' });

  doc.addPage();
}

module.exports = { coverPage };

const PDFDocument = require('pdfkit');
const { getBranding } = require('../utils/branding');
const { coverPage } = require('./templates/coverPage');
const { executiveSummary } = require('./templates/executiveSummary');
const { complianceCharts } = require('./templates/complianceCharts');
const { categorySection } = require('./templates/categorySection');
const { severitySection } = require('./templates/severitySection');
const { recommendationSection } = require('./templates/recommendationSection');
const { technicalAppendix } = require('./templates/technicalAppendix');

async function generatePDF(report, brandingOverrides = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 60, right: 60 },
        info: {
          Title: `Compliance Report - ${report.metadata?.benchmarkName || ''}`,
          Author: 'Compliance Scanner',
          Subject: 'Configuration Compliance Report',
          Producer: 'Compliance Scanner v1.0',
        },
      });

      const branding = getBranding(brandingOverrides);
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      let pageNum = 1;
      const origAddPage = doc.addPage.bind(doc);
      doc.addPage = function(...args) {
        origAddPage(...args);
        pageNum++;
        if (pageNum > 2) {
          doc.fontSize(7).font('Helvetica').fillColor('#666666');
          const fh = doc.page.height - 25;
          doc.text(branding.footerText, 60, fh, { width: 300, lineBreak: false, height: 12 });
          doc.text(`Page ${pageNum}`, doc.page.width - 100, fh, { width: 60, align: 'right', lineBreak: false, height: 12 });
        }
      };

      pageNum = 1;
      coverPage(doc, report, branding);
      executiveSummary(doc, report, branding);
      complianceCharts(doc, report, branding);
      categorySection(doc, report, branding);
      severitySection(doc, report, branding);
      recommendationSection(doc, report, branding);
      technicalAppendix(doc, report, branding);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDF };

const { generateReport } = require('../reporting/reportService');
const { generatePDF } = require('./pdf/pdfGenerator');
const { generateExcel } = require('./excel/excelGenerator');
const { generateCSVZip } = require('./csv/csvGenerator');

async function getReportData(scanId, userId) {
  return await generateReport(scanId, userId);
}

async function exportPDF(scanId, userId) {
  const report = await getReportData(scanId, userId);
  return await generatePDF(report);
}

async function exportExcel(scanId, userId) {
  const report = await getReportData(scanId, userId);
  return await generateExcel(report);
}

async function exportCSV(scanId, userId) {
  const report = await getReportData(scanId, userId);
  return await generateCSVZip(report);
}

function getFilename(report, ext) {
  const meta = report.metadata || {};
  const name = (meta.benchmarkName || 'Benchmark').replace(/[^a-zA-Z0-9]/g, '_');
  const ver = (meta.benchmarkVersion || 'v1').replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  return `ComplianceReport_${name}_${ver}_${date}.${ext}`;
}

module.exports = { exportPDF, exportExcel, exportCSV, getFilename, getReportData };

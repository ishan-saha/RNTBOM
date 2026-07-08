const { exportPDF, exportExcel, exportCSV, getFilename, getReportData } = require('../exports/exportService');

const sendExport = async (req, res, exportFn, ext, mimeType) => {
  try {
    const { scanId } = req.params;
    const report = await getReportData(scanId, req.user._id);
    const buffer = await exportFn(scanId, req.user._id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${getFilename(report, ext)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error(`${ext} export error:`, error);
    if (error.message === 'Scan not found' || error.message === 'No results found for this scan') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: `Failed to generate ${ext.toUpperCase()} export` });
  }
};

const getPDF = (req, res) => sendExport(req, res, exportPDF, 'pdf', 'application/pdf');
const getExcel = (req, res) => sendExport(req, res, exportExcel, 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
const getCSV = (req, res) => sendExport(req, res, exportCSV, 'csv', 'application/zip');

module.exports = { getPDF, getExcel, getCSV };

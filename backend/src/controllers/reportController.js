const { generateReport } = require('../reporting/reportService');

const getReport = async (req, res) => {
  try {
    const { scanId } = req.params;
    const report = await generateReport(scanId, req.user._id);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message === 'Scan not found') {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    if (error.message === 'No results found for this scan') {
      return res.status(404).json({ success: false, message: 'No results found for this scan' });
    }
    console.error('Report generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
    });
  }
};

module.exports = { getReport };

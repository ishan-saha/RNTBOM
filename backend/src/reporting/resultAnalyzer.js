const ComplianceResult = require('../models/ComplianceResult');
const ComplianceScan = require('../models/ComplianceScan');

async function loadResults(scanId, userId) {
  const scan = await ComplianceScan.findOne({
    _id: scanId,
    userId,
  });

  if (!scan) {
    throw new Error('Scan not found');
  }

  const results = await ComplianceResult.find({ scanId })
    .sort({ ruleId: 1 })
    .lean();

  if (!results || results.length === 0) {
    throw new Error('No results found for this scan');
  }

  return { scan, results };
}

module.exports = { loadResults };

const ComplianceScan = require('../models/ComplianceScan');

async function analyzeTrend(userId, currentScan) {
  const previousScans = await ComplianceScan.find({
    userId,
    status: 'completed',
    _id: { $ne: currentScan._id },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
    .select('summary createdAt');

  previousScans.reverse();

  const history = previousScans.map(s => ({
    scanId: s._id,
    score: s.summary?.compliancePercentage || 0,
    date: s.createdAt,
  }));

  if (history.length > 0) {
    history.push({
      scanId: currentScan._id,
      score: currentScan.summary?.compliancePercentage || 0,
      date: currentScan.createdAt,
    });
  }

  const previousScore = history.length > 1
    ? history[history.length - 2].score
    : null;

  const currentScore = currentScan.summary?.compliancePercentage || 0;

  let difference = null;
  if (previousScore !== null) {
    difference = Number((currentScore - previousScore).toFixed(2));
  }

  return {
    previousScore,
    currentScore,
    difference,
    history,
    totalScans: previousScans.length + 1,
  };
}

module.exports = { analyzeTrend };

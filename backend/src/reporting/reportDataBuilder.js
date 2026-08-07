function buildReportData({
  scan,
  results,
  statistics,
  categories,
  severity,
  recommendations,
  warningItems,
  trend,
  aiSection = {},
  aiEnhanced = false,
}) {
  return {
    summary: {
      ...statistics,
      benchmarkName: scan.benchmarkId?.name || null,
      scannedAt: scan.createdAt,
    },
    categories,
    severity,
    recommendations,
    warningItems: warningItems || [],
    trend,
    aiEnhanced,
    executiveSummary: aiSection.executiveSummary || null,
    riskAnalysis: aiSection.riskAnalysis || null,
    aiRecommendations: aiSection.aiRecommendations || null,
    metadata: {
      scanId: scan._id,
      benchmarkId: scan.benchmarkId?._id || scan.benchmarkId,
      parsedConfigurationId: scan.parsedConfigurationId,
      status: scan.status,
      errorMessage: scan.errorMessage || null,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
      totalResults: results.length,
      benchmarkName: scan.benchmarkId?.name || null,
      benchmarkVersion: scan.benchmarkId?.version || null,
    },
  };
}

module.exports = { buildReportData };
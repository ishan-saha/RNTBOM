function buildReportData({
  scan,
  results,
  statistics,
  categories,
  severity,
  recommendations,
  manualChecks,
  missingConfigurations,
  trend,
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
    manualChecks,
    missingConfigurations,
    trend,
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

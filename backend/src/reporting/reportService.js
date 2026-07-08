const { loadResults } = require('./resultAnalyzer');
const { buildStatistics } = require('./statisticsBuilder');
const { analyzeCategories } = require('./categoryAnalyzer');
const { analyzeSeverity } = require('./severityAnalyzer');
const { generateRecommendations } = require('./recommendationEngine');
const { analyzeTrend } = require('./trendAnalyzer');
const { buildReportData } = require('./reportDataBuilder');

async function generateReport(scanId, userId) {
  const { scan, results } = await loadResults(scanId, userId);

  const statistics = buildStatistics(results);
  const categories = analyzeCategories(results);
  const severity = analyzeSeverity(results);
  const { recommendations, manualChecks, missingConfigurations } = generateRecommendations(results);
  const trend = await analyzeTrend(userId, scan);

  const report = buildReportData({
    scan,
    results,
    statistics,
    categories,
    severity,
    recommendations,
    manualChecks,
    missingConfigurations,
    trend,
  });

  return report;
}

module.exports = { generateReport };

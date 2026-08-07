const { loadResults } = require('./resultAnalyzer');
const { buildStatistics } = require('./statisticsBuilder');
const { analyzeCategories } = require('./categoryAnalyzer');
const { analyzeSeverity } = require('./severityAnalyzer');
const { generateRecommendations } = require('./recommendationEngine');
const { analyzeTrend } = require('./trendAnalyzer');
const { buildReportData } = require('./reportDataBuilder');
const { enrichReportWithAI } = require('../services/ai/aiReportGenerator');
const { isAIAvailable } = require('../services/ai/aiService');

async function generateReport(scanId, userId) {
  const { scan, results } = await loadResults(scanId, userId);

  const statistics = buildStatistics(results);
  const categories = analyzeCategories(results);
  const severity = analyzeSeverity(results);
  const { recommendations, warningItems } = generateRecommendations(results);
  const trend = await analyzeTrend(userId, scan);

  let aiSection = {};
  const aiAvailable = await isAIAvailable();
  if (aiAvailable) {
    try {
      aiSection = await enrichReportWithAI(statistics, results);
    } catch (err) {
      console.warn('AI report enrichment failed:', err.message);
    }
  }

  const report = buildReportData({
    scan,
    results,
    statistics,
    categories,
    severity,
    recommendations,
    warningItems,
    trend,
    aiSection,
    aiEnhanced: aiAvailable && Object.keys(aiSection).length > 0,
  });

  return report;
}

module.exports = { generateReport };

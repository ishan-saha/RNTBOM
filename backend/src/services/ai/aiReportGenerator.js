const {
  generateExecutiveSummary,
  generateRiskAnalysis,
  generateAIRecommendations,
} = require('./aiService');

async function enrichReportWithAI(scanSummary, results) {
  const [executiveSummary, riskAnalysis, aiRecommendations] = await Promise.allSettled([
    generateExecutiveSummary(scanSummary, results),
    generateRiskAnalysis(results),
    generateAIRecommendations(results),
  ]);

  return {
    executiveSummary: executiveSummary.status === 'fulfilled'
      ? executiveSummary.value
      : 'AI-powered executive summary could not be generated. Review the scan results below.',
    riskAnalysis: riskAnalysis.status === 'fulfilled'
      ? riskAnalysis.value
      : { overallRiskLevel: 'unknown', riskFactors: [], topRisks: [], complianceImplications: '' },
    aiRecommendations: aiRecommendations.status === 'fulfilled'
      ? aiRecommendations.value
      : { prioritizedActions: [], quickWins: [], dependencies: [] },
  };
}

module.exports = { enrichReportWithAI };

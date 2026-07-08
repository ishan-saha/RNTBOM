const { parsePdf } = require('./pdfParser');
const { splitRecommendations } = require('./recommendationSplitter');
const { extractSections } = require('./sectionExtractor');
const { normalizeRule } = require('./ruleNormalizer');

async function importBenchmarkPdf(filePath) {
  const pdfResult = await parsePdf(filePath);

  const recommendations = splitRecommendations(pdfResult.pages);

  const rules = [];
  const errors = [];

  for (const rec of recommendations) {
    try {
      const parsed = extractSections(rec);

      const normalized = normalizeRule(parsed);

      rules.push({
        ruleId: normalized.ruleId,
        categoryId: normalized.categoryId,
        categoryTitle: normalized.categoryTitle,
        title: normalized.title,
        severity: normalized.severity,
        profile: normalized.profile,
        status: normalized.status,
        pageNumber: normalized.pageNumber,
        description: normalized.description,
        rationale: normalized.rationale,
        impact: normalized.impact,
        audit: normalized.audit,
        remediation: normalized.remediation,
        defaultValue: normalized.defaultValue,
        references: normalized.references,
        cisControls: normalized.cisControls,
        rawText: rec.text,
        comparison: normalized.comparison,
      });
    } catch (err) {
      errors.push({ ruleId: rec.ruleId, error: err.message });
    }
  }

  return { rules, errors, numPages: pdfResult.numPages };
}

module.exports = { importBenchmarkPdf };

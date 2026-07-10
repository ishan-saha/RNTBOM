const logger = require('../utils/logger');

const VALID_OPERATORS = new Set([
  'equals', 'notEquals', 'contains', 'notContains',
  'greaterThan', 'lessThan', 'regex', 'in', 'notIn',
  'equals', 'not equals', '>', '<', '>=', '<=', 'contains',
]);

const VALID_CONFIG_SOURCES = new Set([
  'chrome-policy', 'windows-registry', 'mac-plist', 'file-content',
  'command-output', 'dconf', 'sysctl', 'audit-pol', 'iis-config',
  'docker-config', 'kubernetes',
]);

const VALID_SEVERITIES = new Set(['L1', 'L2', 'L3', 'critical', 'high', 'medium', 'low']);

function isAutomatedValue(val) {
  if (!val) return false;
  const lower = String(val).toLowerCase().trim();
  return lower === 'automated' || lower === 'automated/manual';
}

function validateBenchmarkExtraction(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a valid JSON object'], warnings: [], rules: [] };
  }

  const benchmarkInfo = {
    name: data.benchmark_name || data.benchmarkName || null,
    version: data.benchmark_version || data.benchmarkVersion || null,
    category: data.benchmark_category || data.benchmarkCategory || null,
  };

  if (!benchmarkInfo.name) {
    warnings.push('Benchmark name is missing');
  }
  if (!benchmarkInfo.version) {
    warnings.push('Benchmark version is missing');
  }
  if (!benchmarkInfo.category) {
    warnings.push('Benchmark category is missing');
  }

  const rawRules = Array.isArray(data.rules) ? data.rules : [];
  if (rawRules.length === 0) {
    return { valid: true, errors, warnings: [...warnings, 'No rules found in AI response'], rules: [], benchmarkInfo };
  }

  const seenRuleIds = new Set();
  const validatedRules = [];

  for (let i = 0; i < rawRules.length; i++) {
    const rule = rawRules[i];
    const ruleErrors = [];
    const ruleWarnings = [];

    if (!rule || typeof rule !== 'object') {
      ruleErrors.push(`Rule at index ${i} is not a valid object`);
      continue;
    }

    const ruleId = rule.rule_id || rule.ruleId || '';
    if (!ruleId) {
      ruleErrors.push(`Rule at index ${i} has missing or invalid rule_id`);
    } else {
      if (seenRuleIds.has(ruleId)) {
        ruleWarnings.push(`Duplicate rule_id "${ruleId}" at index ${i} — skipping`);
        continue;
      }
      seenRuleIds.add(ruleId);
    }

    const title = rule.rule_title || rule.title || '';
    if (!title) {
      ruleErrors.push(`Rule "${ruleId || i}" has missing or empty title`);
    }

    const severity = rule.severity || null;
    if (severity && !VALID_SEVERITIES.has(severity)) {
      ruleWarnings.push(`Rule "${ruleId}" has unrecognized severity "${severity}"`);
    }

    const comparisonOperator = rule.comparison_operator || rule.comparisonOperator || null;

    if (ruleErrors.length > 0) {
      errors.push(...ruleErrors);
      logger.warn('Validation error for rule', { ruleId: ruleId || 'unknown', errors: ruleErrors });
      continue;
    }

    if (ruleWarnings.length > 0) {
      warnings.push(...ruleWarnings);
    }

    validatedRules.push({
      ruleId,
      categoryId: rule.category_id || rule.categoryId || null,
      categoryTitle: rule.category_title || rule.categoryTitle || null,
      title,
      description: rule.description || null,
      rationale: rule.rationale || null,
      impact: rule.impact || null,
      audit: rule.audit || null,
      remediation: rule.remediation || null,
      severity,
      configSource: rule.configuration_source || rule.configSource || null,
      configKey: rule.configuration_key || rule.configKey || null,
      expectedValue: rule.expected_value !== undefined ? rule.expected_value : (rule.expectedValue !== undefined ? rule.expectedValue : null),
      comparisonOperator,
      isAutomated: isAutomatedValue(rule.automated_or_manual || rule.isAutomated),
      additionalNotes: rule.additional_notes || rule.additionalNotes || null,
    });
  }

  return {
    valid: validatedRules.length > 0,
    errors,
    warnings,
    rules: validatedRules,
    benchmarkInfo,
    totalRaw: rawRules.length,
    totalValid: validatedRules.length,
    totalSkipped: rawRules.length - validatedRules.length,
  };
}

module.exports = { validateBenchmarkExtraction };

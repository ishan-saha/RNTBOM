const { hasOperator } = require('./operatorRegistry');

function preprocessRule(rule) {
  const warnings = [];
  const comparison = rule.comparison || {};

  const conditions = comparison.conditions;
  if (conditions && Array.isArray(conditions) && conditions.length > 0) {
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (!c.key || typeof c.key !== 'string' || !c.key.trim()) {
        return { valid: false, skip: true, reason: `Condition ${i + 1} has no key defined`, warnings };
      }
      if (!c.operator) {
        return { valid: false, skip: true, reason: `Condition ${i + 1} (${c.key}) has no operator`, warnings };
      }
      if (!hasOperator(c.operator)) {
        return { valid: false, skip: true, reason: `Condition ${i + 1} (${c.key}) operator "${c.operator}" not implemented`, warnings };
      }
    }
    const assessment = rule.status?.assessment?.toLowerCase() || '';
    if (assessment === 'manual' || assessment === 'not applicable') {
      return { valid: true, manual: true, reason: 'Manual assessment', warnings };
    }
    return { valid: true, skip: false, manual: false, warnings };
  }

  if (!comparison.key || typeof comparison.key !== 'string' || !comparison.key.trim()) {
    return { valid: false, skip: true, reason: 'No comparison key defined', warnings };
  }

  if (!comparison.operator) {
    return { valid: false, skip: true, reason: `No operator defined for key "${comparison.key}"`, warnings };
  }

  if (!hasOperator(comparison.operator)) {
    return { valid: false, skip: true, reason: `Operator "${comparison.operator}" is not implemented`, warnings };
  }

  const assessment = rule.status?.assessment?.toLowerCase() || '';
  if (assessment === 'manual' || assessment === 'not applicable') {
    return { valid: true, manual: true, reason: 'Manual assessment', warnings };
  }

  return { valid: true, skip: false, manual: false, warnings };
}

function preprocessRules(rules) {
  const valid = [];
  const skipped = [];
  const manual = [];

  for (const rule of rules) {
    const result = preprocessRule(rule);
    if (result.skip) {
      skipped.push({ ruleId: rule.ruleId, reason: result.reason });
    } else if (result.manual) {
      manual.push(rule);
    } else {
      valid.push(rule);
    }
  }

  return { valid, skipped, manual };
}

module.exports = { preprocessRule, preprocessRules };

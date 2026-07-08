const { compare } = require('./operatorRegistry');

const RESULT_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  MANUAL: 'manual',
  NOT_FOUND: 'not_found',
  SKIPPED: 'skipped',
};

function evaluateSingleCondition(condition, config) {
  const key = condition.key;
  const operator = condition.operator;
  const expected = condition.expected;

  const actual = config[key];

  if (actual === undefined || actual === null) {
    return {
      key,
      operator,
      expected,
      actual: null,
      passed: false,
      reason: `Configuration key "${key}" not found`,
    };
  }

  const result = compare(operator, actual, expected);

  if (result.error) {
    return {
      key,
      operator,
      expected,
      actual,
      passed: false,
      reason: result.reason,
    };
  }

  return {
    key,
    operator,
    expected,
    actual,
    passed: result.passed,
    reason: result.reason || '',
  };
}

function evaluateMultiCondition(conditions, logic, config) {
  const conditionResults = conditions.map(c => evaluateSingleCondition(c, config));

  if (logic === 'OR') {
    const anyPassed = conditionResults.some(c => c.passed);
    const failedReasons = conditionResults.filter(c => !c.passed).map(c => c.reason).filter(Boolean);
    return {
      status: anyPassed ? RESULT_STATUS.PASS : RESULT_STATUS.FAIL,
      actual: conditionResults.reduce((acc, c) => { acc[c.key] = c.actual; return acc; }, {}),
      reason: anyPassed ? '' : `No condition satisfied: ${failedReasons.join('; ')}`,
      conditions: conditionResults,
    };
  }

  const allPassed = conditionResults.every(c => c.passed);
  const failedReasons = conditionResults.filter(c => !c.passed).map(c => `"${c.key}" ${c.reason}`).filter(Boolean);
  return {
    status: allPassed ? RESULT_STATUS.PASS : RESULT_STATUS.FAIL,
    actual: conditionResults.reduce((acc, c) => { acc[c.key] = c.actual; return acc; }, {}),
    reason: allPassed ? '' : `Conditions not met: ${failedReasons.join('; ')}`,
    conditions: conditionResults,
  };
}

function buildExpectedSummary(conditions, logic) {
  if (!conditions || conditions.length === 0) return null;
  const parts = conditions.map(c => `${c.key} ${c.operator} ${c.expected}`);
  return `${logic || 'AND'}(${parts.join(', ')})`;
}

function evaluateRule(rule, config) {
  const comparison = rule.comparison || {};
  const isAutomated = comparison.isAutomated;

  const assessment = (rule.status?.assessment || '').toLowerCase();
  if (assessment === 'manual' || assessment === 'not applicable') {
    return { status: RESULT_STATUS.MANUAL, actual: null, reason: 'Manual assessment — requires human review' };
  }

  if (!isAutomated) {
    return { status: RESULT_STATUS.SKIPPED, actual: null, reason: 'Rule is not marked as automated' };
  }

  const conditions = comparison.conditions;
  const logic = comparison.logic || 'AND';

  if (conditions && Array.isArray(conditions) && conditions.length > 0) {
    const result = evaluateMultiCondition(conditions, logic, config);
    result.expectedSummary = buildExpectedSummary(conditions, logic);
    return result;
  }

  const key = comparison.key;
  const operator = comparison.operator;
  const expectedValue = comparison.expectedValue;

  if (!key || typeof key !== 'string' || !key.trim()) {
    return { status: RESULT_STATUS.SKIPPED, actual: null, reason: 'No comparison key defined' };
  }

  const actualValue = config[key];

  if (actualValue === undefined || actualValue === null) {
    return {
      status: RESULT_STATUS.NOT_FOUND,
      actual: null,
      reason: `Configuration key "${key}" not found in uploaded files`,
    };
  }

  if (!operator) {
    return { status: RESULT_STATUS.SKIPPED, actual: actualValue, reason: 'No comparison operator defined' };
  }

  const result = compare(operator, actualValue, expectedValue);

  if (result.error) {
    return { status: RESULT_STATUS.SKIPPED, actual: actualValue, reason: result.reason };
  }

  return {
    status: result.passed ? RESULT_STATUS.PASS : RESULT_STATUS.FAIL,
    actual: actualValue,
    reason: result.reason || '',
  };
}

module.exports = { evaluateRule, RESULT_STATUS };

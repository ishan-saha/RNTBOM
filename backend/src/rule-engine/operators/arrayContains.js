function compare(actual, expected) {
  if (!Array.isArray(actual)) {
    return { passed: false, reason: `Expected an array, got "${typeof actual}"` };
  }

  const expectedStr = String(expected);
  const passed = actual.some(item => String(item) === expectedStr);

  return {
    passed,
    reason: passed ? '' : `Expected array to contain "${expected}"`,
  };
}

module.exports = { compare };

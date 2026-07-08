function compare(actual, expected) {
  const passed = String(actual) === String(expected);
  return {
    passed,
    reason: passed ? '' : `Expected "${expected}", got "${actual}"`,
  };
}

module.exports = { compare };

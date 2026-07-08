function compare(actual, expected) {
  const passed = actual === undefined || actual === null || actual === '';
  return {
    passed,
    reason: passed ? '' : `Expected value to be absent, but found "${actual}"`,
  };
}

module.exports = { compare };

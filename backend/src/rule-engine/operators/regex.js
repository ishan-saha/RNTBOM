function compare(actual, expected) {
  const str = String(actual ?? '');
  try {
    const regex = new RegExp(expected);
    const passed = regex.test(str);
    return {
      passed,
      reason: passed ? '' : `Expected "${str}" to match pattern /${expected}/`,
    };
  } catch (err) {
    return { passed: false, reason: `Invalid regex pattern: ${err.message}` };
  }
}

module.exports = { compare };

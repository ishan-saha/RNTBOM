function compare(actual, expected) {
  const a = Number(actual);
  const e = Number(expected);
  if (isNaN(a)) {
    return { passed: false, reason: `Actual value "${actual}" is not a number` };
  }
  const passed = a >= e;
  return {
    passed,
    reason: passed ? '' : `Expected >= ${e}, got ${a}`,
  };
}

module.exports = { compare };

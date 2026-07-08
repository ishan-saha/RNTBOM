function compare(actual, expected) {
  const a = Number(actual);
  if (isNaN(a)) {
    return { passed: false, reason: `Actual value "${actual}" is not a number` };
  }

  if (!Array.isArray(expected) || expected.length < 2) {
    return { passed: false, reason: `Range requires [min, max] array, got "${JSON.stringify(expected)}"` };
  }

  const min = Number(expected[0]);
  const max = Number(expected[1]);
  const passed = a >= min && a <= max;

  return {
    passed,
    reason: passed ? '' : `Expected ${a} to be in range [${min}, ${max}]`,
  };
}

module.exports = { compare };

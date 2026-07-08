function compare(actual, expected) {
  const passed = String(actual) !== String(expected);
  return {
    passed,
    reason: passed ? '' : `Value "${actual}" should not equal "${expected}"`,
  };
}

module.exports = { compare };

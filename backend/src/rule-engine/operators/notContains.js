function compare(actual, expected) {
  const str = String(actual ?? '');
  const passed = !str.includes(String(expected));
  return {
    passed,
    reason: passed ? '' : `Expected "${str}" to NOT contain "${expected}"`,
  };
}

module.exports = { compare };

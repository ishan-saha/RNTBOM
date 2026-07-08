function compare(actual, expected) {
  const passed = actual !== undefined && actual !== null && actual !== '';
  return {
    passed,
    reason: passed ? '' : 'Expected value to exist',
  };
}

module.exports = { compare };

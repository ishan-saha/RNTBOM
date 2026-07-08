function compare(actual, expected) {
  const a = String(actual ?? '').trim();
  const e = String(expected ?? '').trim();

  const normalizedActual = a.length === 4 ? a.slice(1) : a;
  const normalizedExpected = e.length === 4 ? e.slice(1) : e;

  const passed = normalizedActual === normalizedExpected;

  return {
    passed,
    reason: passed ? '' : `Expected permissions "${normalizedExpected}", got "${normalizedActual}"`,
  };
}

module.exports = { compare };

const Benchmark = require('../models/Benchmark');

async function getBenchmark(benchmarkId) {
  return Benchmark.findById(benchmarkId).lean();
}

module.exports = { getBenchmark };
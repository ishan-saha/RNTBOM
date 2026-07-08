const mongoose = require('mongoose');

const BenchmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  version: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  uploadedDate: {
    type: Date,
    default: Date.now,
  },
  fileName: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

BenchmarkSchema.index({ name: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Benchmark', BenchmarkSchema);

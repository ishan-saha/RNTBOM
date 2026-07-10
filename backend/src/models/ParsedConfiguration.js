const mongoose = require('mongoose');

const ParsedConfigurationSchema = new mongoose.Schema({
  benchmarkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Benchmark',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  uploadedFiles: [{
    fileName: String,
    parser: String,
    warnings: [String],
  }],
  normalizedConfiguration: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  parserUsed: {
    type: [String],
    default: [],
  },
  keyCount: {
    type: Number,
    default: 0,
  },
  parsingWarnings: {
    type: [String],
    default: [],
  },
  processingTime: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
});

ParsedConfigurationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ParsedConfiguration', ParsedConfigurationSchema);

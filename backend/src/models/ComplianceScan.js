const mongoose = require('mongoose');

const ComplianceScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  benchmarkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Benchmark',
    required: true,
    index: true,
  },
  parsedConfigurationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParsedConfiguration',
    required: true,
  },
  summary: {
    total: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    manual: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    notFound: { type: Number, default: 0 },
    compliancePercentage: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: true,
});

ComplianceScanSchema.index({ userId: 1, createdAt: -1 });
ComplianceScanSchema.index({ benchmarkId: 1 });

module.exports = mongoose.model('ComplianceScan', ComplianceScanSchema);

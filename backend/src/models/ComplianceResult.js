const mongoose = require('mongoose');

const ComplianceResultSchema = new mongoose.Schema({
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplianceScan',
    required: true,
    index: true,
  },
  benchmarkId: {
    type: String,
    required: true,
  },
  ruleId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  categoryId: {
    type: String,
    default: '',
  },
  categoryTitle: {
    type: String,
    default: '',
  },
  severity: {
    type: String,
    default: '',
  },
  pageNumber: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    default: '',
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'warning'],
    required: true,
  },
  expected: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  actual: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  comparisonOperator: {
    type: String,
    default: null,
  },
  comparisonKey: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    default: '',
  },
  remediation: {
    type: String,
    default: '',
  },
  audit: {
    type: String,
    default: '',
  },
  confidence: {
    type: Number,
    default: null,
  },
  risk: {
    type: String,
    default: null,
  },
  recommendation: {
    type: String,
    default: '',
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

ComplianceResultSchema.index({ scanId: 1, ruleId: 1 });
ComplianceResultSchema.index({ scanId: 1, result: 1 });
ComplianceResultSchema.index({ scanId: 1, result: 1, severity: 1 });

module.exports = mongoose.model('ComplianceResult', ComplianceResultSchema);
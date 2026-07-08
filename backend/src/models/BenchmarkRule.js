const mongoose = require('mongoose');

const BenchmarkRuleSchema = new mongoose.Schema({
  benchmarkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Benchmark',
    required: true,
    index: true,
  },
  ruleId: {
    type: String,
    required: true,
    trim: true,
  },
  categoryId: {
    type: String,
    default: '',
    trim: true,
  },
  categoryTitle: {
    type: String,
    default: '',
    trim: true,
  },
  title: {
    type: String,
    default: '',
    trim: true,
  },
  profile: {
    level: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  status: {
    assessment: { type: String, default: '' },
    supported: { type: Boolean, default: true },
  },
  severity: {
    type: String,
    default: '',
    trim: true,
  },
  pageNumber: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
  rationale: {
    type: String,
    default: '',
  },
  impact: {
    type: String,
    default: '',
  },
  audit: {
    type: String,
    default: '',
  },
  remediation: {
    type: String,
    default: '',
  },
  defaultValue: {
    type: String,
    default: '',
  },
  references: {
    type: String,
    default: '',
  },
  cisControls: {
    type: String,
    default: '',
  },
  rawText: {
    type: String,
    default: '',
  },
  comparison: {
    key: { type: String, default: null },
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'regex', 'in', 'notIn', null],
      default: null,
    },
    expectedValue: { type: mongoose.Schema.Types.Mixed, default: null },
    configSource: {
      type: String,
      enum: ['chrome-policy', 'windows-registry', 'mac-plist', 'file-content', 'command-output', 'dconf', 'sysctl', 'audit-pol', 'iis-config', 'docker-config', 'kubernetes', null],
      default: null,
    },
    comparisonType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'regex', null],
      default: null,
    },
    supportedValues: [{ type: String }],
    isAutomated: { type: Boolean, default: false },
    conditions: [{
      key: { type: String, required: true },
      operator: { type: String, required: true },
      expected: { type: mongoose.Schema.Types.Mixed, default: null },
      configSource: { type: String, default: null },
      comparisonType: { type: String, default: null },
    }],
    logic: {
      type: String,
      enum: ['AND', 'OR', null],
      default: null,
    },
  },
}, {
  timestamps: true,
});

BenchmarkRuleSchema.index({ benchmarkId: 1, ruleId: 1 }, { unique: true });
BenchmarkRuleSchema.index({ benchmarkId: 1, categoryId: 1 });

module.exports = mongoose.model('BenchmarkRule', BenchmarkRuleSchema);

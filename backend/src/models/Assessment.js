const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  configFileName: {
    type: String,
    default: '',
  },
  vendor: {
    type: String,
    enum: ['aws', 'cisco', 'paloalto', 'fortinet'],
    required: true,
  },
  complianceScore: {
    type: Number,
    default: 0,
  },
  counts: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    pass: { type: Number, default: 0 },
    manual: { type: Number, default: 0 },
  },
  totalControls: {
    type: Number, default: 0,
  },
  findings: [{
    id: String,
    title: String,
    category: String,
    severity: String,
    status: String,
    standards: [String],
    remediation: String,
    evidence: String,
  }],
  configSnippet: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

AssessmentSchema.index({ uploadedBy: 1, createdAt: -1 });
AssessmentSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('Assessment', AssessmentSchema);

const { assessFirewallConfig, detectVendor, VENDOR_RULES } = require('../services/firewallRules');
const Assessment = require('../models/Assessment');
const { getOrgId } = require('../utils/scanAccess');

// ─── DETECT VENDOR ──────────────────────────────────────────────────────────
const detectVendorFromText = async (req, res) => {
  try {
    const { configText } = req.body;
    if (!configText || !configText.trim()) {
      return res.status(400).json({ success: false, message: 'configText is required.' });
    }
    const vendor = detectVendor(configText);
    const lineCount = configText.split(/\r?\n/).length;
    return res.status(200).json({ success: true, data: { vendor, lineCount } });
  } catch (error) {
    console.error('Vendor detection error:', error);
    return res.status(500).json({ success: false, message: 'Server error during vendor detection.' });
  }
};

// ─── LIVE AWS SCAN (simulated) ──────────────────────────────────────────────
const runLiveScan = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, region } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({ success: false, message: 'AWS Access Key ID and Secret Access Key are required.' });
    }

    const simulatedPayload = `
      "root_account_mfa_enabled": false,
      "password_enabled": true,
      "mfa_active": false,
      "BlockPublicAcls": false,
      "IsMultiRegionTrail": false,
      "FromPort": 22, "CidrIp": "0.0.0.0/0"
    `;

    const result = assessFirewallConfig(simulatedPayload, 'aws');

    return res.status(200).json({
      success: true,
      message: 'Live audit simulation complete.',
      data: {
        ...result,
        region: region || 'us-east-1',
        simulated: true,
      },
    });
  } catch (error) {
    console.error('Live scan error:', error);
    return res.status(500).json({ success: false, message: 'Server error during live scan.' });
  }
};

// ─── LIST RULES ─────────────────────────────────────────────────────────────
const getRules = async (req, res) => {
  try {
    const { vendor } = req.query;
    const allowed = ['aws', 'cisco', 'paloalto', 'fortinet'];
    if (!vendor || !allowed.includes(vendor)) {
      return res.status(400).json({ success: false, message: `Query param "vendor" required. Allowed: ${allowed.join(', ')}` });
    }
    const rules = (VENDOR_RULES[vendor] || []).map(r => ({
      id: r.id, category: r.category, title: r.title,
      severity: r.severity, standards: r.standards, remediation: r.remediation,
    }));
    return res.status(200).json({ success: true, data: { vendor, total: rules.length, rules } });
  } catch (error) {
    console.error('Get rules error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── RUN ASSESSMENT (and optionally save) ──────────────────────────────────
const runAssessment = async (req, res) => {
  try {
    const { configText, vendor, save, configFileName } = req.body;

    if (!configText || !configText.trim()) {
      return res.status(400).json({ success: false, message: 'configText is required.' });
    }
    if (configText.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'configText must be at least 20 characters.' });
    }

    const allowedVendors = ['auto', 'aws', 'cisco', 'paloalto', 'fortinet'];
    if (vendor && !allowedVendors.includes(vendor)) {
      return res.status(400).json({ success: false, message: `Invalid vendor. Allowed: ${allowedVendors.join(', ')}` });
    }

    const result = assessFirewallConfig(configText, vendor);

    let saved = null;
    if (save) {
      const organizationId = getOrgId(req.user);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'User organization not found.' });
      }
      saved = await Assessment.create({
        organization: organizationId,
        uploadedBy: req.user._id,
        configFileName: configFileName || '',
        vendor: result.vendor,
        complianceScore: result.complianceScore,
        counts: result.counts,
        totalControls: result.totalControls,
        findings: result.findings,
        configSnippet: configText.slice(0, 2000),
      });
    }

    return res.status(200).json({ success: true, data: { ...result, savedId: saved?._id || null } });
  } catch (error) {
    console.error('Firewall assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error during firewall assessment.' });
  }
};

// ─── LIST SAVED ASSESSMENTS ────────────────────────────────────────────────
const getAssessments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { uploadedBy: req.user._id };

    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .select('vendor complianceScore counts.totalControls counts.critical counts.high counts.medium counts.low createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Assessment.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data: { assessments, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    console.error('Get assessments error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET SINGLE ASSESSMENT ─────────────────────────────────────────────────
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });
    return res.status(200).json({ success: true, data: { assessment } });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE ASSESSMENT ─────────────────────────────────────────────────────
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });
    return res.status(200).json({ success: true, message: 'Assessment deleted.' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── EXPORT CSV (from saved assessment) ────────────────────────────────────
const exportCsv = async (req, res) => {
  try {
    let findings;
    if (req.params.id) {
      const assessment = await Assessment.findOne({ _id: req.params.id, uploadedBy: req.user._id });
      if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });
      findings = assessment.findings;
    } else {
      const { findings: inlineFindings } = req.body;
      if (!inlineFindings || !Array.isArray(inlineFindings) || !inlineFindings.length) {
        return res.status(400).json({ success: false, message: 'Findings array required in request body.' });
      }
      findings = inlineFindings;
    }

    const header = ['Control ID', 'Category', 'Title', 'Severity/Status', 'Standards', 'Evidence', 'Recommendation'];
    const rows = findings.map(f => [
      f.id, f.category, f.title, f.severity,
      (f.standards || []).join(' | '),
      (f.evidence || '').replace(/\n/g, ' / '),
      f.status !== 'pass' ? f.remediation : '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="firewall-gap-assessment.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  detectVendorFromText,
  getRules,
  runAssessment,
  runLiveScan,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
  exportCsv,
};

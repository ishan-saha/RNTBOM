'use strict';

const crypto = require('crypto');
const nodemailer = require('nodemailer');

const EmailConfig = require('../models/EmailConfig');
const SeoSetting = require('../models/SeoSetting');

const AES_KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET || 'sbom-admin-settings-secret')
  .digest();

const encryptSecret = (value) => {
  if (!value) return '';

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
};

const decryptSecret = (value) => {
  if (!value) return '';

  const parts = String(value).split(':');
  if (parts.length !== 3) return value;

  const [ivHex, authTagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

const normalizeKeywords = (keywords) => {
  if (Array.isArray(keywords)) return keywords.map((item) => String(item).trim()).filter(Boolean);
  if (typeof keywords === 'string') {
    return keywords.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const sanitizeEmailConfig = (configDoc) => configDoc.toJSON();

const buildEmailTransport = (configDoc) => {
  const password = decryptSecret(configDoc.password);

  return nodemailer.createTransport({
    host: configDoc.host,
    port: Number(configDoc.port),
    secure: Boolean(configDoc.secure),
    auth: {
      user: configDoc.username,
      pass: password,
    },
  });
};

const listEmailConfigs = async (req, res) => {
  try {
    const configs = await EmailConfig.find().select('+password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        items: configs.map((config) => sanitizeEmailConfig(config)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load email configs.' });
  }
};

const getEmailConfigById = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select('+password');

    if (!config) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    res.status(200).json({ success: true, data: sanitizeEmailConfig(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load email config.' });
  }
};

const createEmailConfig = async (req, res) => {
  try {
    const {
      provider,
      host,
      port,
      secure,
      username,
      password,
      fromName,
      fromEmail,
      isActive,
    } = req.body;

    if (!provider || !host || !port || !username || !password || !fromName || !fromEmail) {
      return res.status(400).json({ success: false, message: 'All SMTP fields are required.' });
    }

    const created = await EmailConfig.create({
      provider: String(provider).trim(),
      host: String(host).trim(),
      port: Number(port),
      secure: Boolean(secure),
      username: String(username).trim(),
      password: encryptSecret(password),
      fromName: String(fromName).trim(),
      fromEmail: String(fromEmail).trim(),
      isActive: Boolean(isActive),
    });

    if (created.isActive) {
      await EmailConfig.updateMany({ _id: { $ne: created._id } }, { $set: { isActive: false } });
    }

    const saved = await EmailConfig.findById(created._id).select('+password');

    res.status(201).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create email config.' });
  }
};

const updateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select('+password');

    if (!config) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    const {
      provider,
      host,
      port,
      secure,
      username,
      password,
      fromName,
      fromEmail,
      isActive,
    } = req.body;

    if (provider !== undefined) config.provider = String(provider).trim();
    if (host !== undefined) config.host = String(host).trim();
    if (port !== undefined) config.port = Number(port);
    if (secure !== undefined) config.secure = Boolean(secure);
    if (username !== undefined) config.username = String(username).trim();
    if (fromName !== undefined) config.fromName = String(fromName).trim();
    if (fromEmail !== undefined) config.fromEmail = String(fromEmail).trim();
    if (password && String(password).trim()) config.password = encryptSecret(password);
    if (isActive !== undefined) config.isActive = Boolean(isActive);

    await config.save();

    if (config.isActive) {
      await EmailConfig.updateMany({ _id: { $ne: config._id } }, { $set: { isActive: false } });
    }

    const saved = await EmailConfig.findById(config._id).select('+password');

    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email config.' });
  }
};

const deleteEmailConfig = async (req, res) => {
  try {
    const deleted = await EmailConfig.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    res.status(200).json({ success: true, message: 'Email config deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete email config.' });
  }
};

const activateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select('+password');

    if (!config) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    config.isActive = true;
    await config.save();
    await EmailConfig.updateMany({ _id: { $ne: config._id } }, { $set: { isActive: false } });

    const saved = await EmailConfig.findById(config._id).select('+password');
    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate email config.' });
  }
};

const deactivateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select('+password');

    if (!config) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    config.isActive = false;
    await config.save();

    const saved = await EmailConfig.findById(config._id).select('+password');
    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deactivate email config.' });
  }
};

const testEmailConfig = async (req, res) => {
  try {
    const { recipient } = req.body;

    if (!recipient || !String(recipient).trim()) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    const config = await EmailConfig.findById(req.params.id).select('+password');

    if (!config) {
      return res.status(404).json({ success: false, message: 'Email config not found.' });
    }

    const transporter = buildEmailTransport(config);
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail || config.username}>`,
      to: String(recipient).trim(),
      subject: 'SMTP Test Email',
      text: 'This is a test email from the SEO & SMTP admin settings page.',
      html: '<p>This is a test email from the SEO & SMTP admin settings page.</p>',
    });

    res.status(200).json({ success: true, message: 'Test email sent successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send test email.' });
  }
};

const listSeoSettings = async (req, res) => {
  try {
    const settings = await SeoSetting.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load SEO settings.' });
  }
};

const getSeoSettingById = async (req, res) => {
  try {
    const setting = await SeoSetting.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ success: false, message: 'SEO setting not found.' });
    }

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load SEO setting.' });
  }
};

const saveSeoSetting = async (req, res, existingSetting = null) => {
  const route = String(req.body.route || '/').trim() || '/';
  const payload = {
    route,
    pageName: String(req.body.pageName || 'Global Settings').trim(),
    metaTitle: String(req.body.metaTitle || '').trim(),
    metaDescription: String(req.body.metaDescription || '').trim(),
    canonicalUrl: String(req.body.canonicalUrl || '').trim(),
    keywords: normalizeKeywords(req.body.keywords),
    openGraph: {
      title: String(req.body.openGraph?.title || '').trim(),
      description: String(req.body.openGraph?.description || '').trim(),
      image: String(req.body.openGraph?.image || '').trim(),
      type: String(req.body.openGraph?.type || 'website').trim(),
    },
    twitter: {
      title: String(req.body.twitter?.title || '').trim(),
      description: String(req.body.twitter?.description || '').trim(),
      image: String(req.body.twitter?.image || '').trim(),
      card: String(req.body.twitter?.card || 'summary_large_image').trim(),
    },
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
  };

  if (existingSetting) {
    existingSetting.set(payload);
    await existingSetting.save();
    return existingSetting;
  }

  const existingByRoute = await SeoSetting.findOne({ route });
  if (existingByRoute) {
    existingByRoute.set(payload);
    await existingByRoute.save();
    return existingByRoute;
  }

  return SeoSetting.create(payload);
};

const createSeoSetting = async (req, res) => {
  try {
    if (!req.body.metaTitle || !req.body.metaDescription) {
      return res.status(400).json({ success: false, message: 'SEO title and description are required.' });
    }

    const setting = await saveSeoSetting(req);
    res.status(201).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create SEO setting.' });
  }
};

const updateSeoSetting = async (req, res) => {
  try {
    const setting = await SeoSetting.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ success: false, message: 'SEO setting not found.' });
    }

    if (req.body.metaTitle === undefined && req.body.metaDescription === undefined && req.body.openGraph === undefined && req.body.twitter === undefined && req.body.keywords === undefined && req.body.route === undefined && req.body.pageName === undefined && req.body.isActive === undefined) {
      return res.status(400).json({ success: false, message: 'No SEO fields provided.' });
    }

    const updated = await saveSeoSetting(req, setting);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update SEO setting.' });
  }
};

module.exports = {
  listEmailConfigs,
  getEmailConfigById,
  createEmailConfig,
  updateEmailConfig,
  deleteEmailConfig,
  activateEmailConfig,
  deactivateEmailConfig,
  testEmailConfig,
  listSeoSettings,
  getSeoSettingById,
  createSeoSetting,
  updateSeoSetting,
};
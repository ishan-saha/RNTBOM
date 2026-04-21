"use strict";

const crypto = require("crypto");
const path = require("path");
const nodemailer = require("nodemailer");

const EmailConfig = require("../models/EmailConfig");
const SeoSetting = require("../models/SeoSetting");
const Scan = require("../models/Scan");

const DEFAULT_EMAIL_PROVIDER = process.env.SMTP_PROVIDER || "mailtrap";
const DEFAULT_EMAIL_HOST = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const DEFAULT_EMAIL_PORT = Number(process.env.SMTP_PORT || 2525);
const DEFAULT_EMAIL_SECURE =
  String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const DEFAULT_EMAIL_USERNAME = process.env.SMTP_EMAIL_USERNAME || "";
const DEFAULT_EMAIL_PASSWORD = process.env.SMTP_EMAIL_PASSWORD || "";
const DEFAULT_EMAIL_FROM_NAME =
  process.env.SMTP_FROM_NAME || "SBOM Full Security Team";
const DEFAULT_EMAIL_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL || "noreply@sbom-full.local";

const AES_KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "sbom-admin-settings-secret")
  .digest();

const encryptSecret = (value) => {
  if (!value) return "";

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

const decryptSecret = (value) => {
  if (!value) return "";

  const parts = String(value).split(":");
  if (parts.length !== 3) return value;

  const [ivHex, authTagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    AES_KEY,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

const normalizeKeywords = (keywords) => {
  if (Array.isArray(keywords))
    return keywords.map((item) => String(item).trim()).filter(Boolean);
  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeEmailConfig = (configDoc) => configDoc.toJSON();

const escapeHtml = (value) =>
  String(value || "")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");

const buildBrandedEmailTemplate = ({ username, body }) => {
  const safeUsername = escapeHtml(username || "there");
  const safeBody = escapeHtml(
    body || "This is a test email from the SEO & SMTP admin settings page.",
  );

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0f0f1a;padding:24px;color:#e5e7eb;">
      <div style="max-width:680px;margin:0 auto;background:#13131f;border:1px solid rgba(255,255,255,0.08);border-radius:22px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
        <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(135deg,rgba(79,70,229,0.18),rgba(56,189,248,0.08));display:flex;align-items:center;gap:16px;">
          <img src="cid:rnt-logo" alt="RNT Infosec LLP" style="width:72px;height:72px;object-fit:contain;border-radius:18px;background:rgba(255,255,255,0.06);padding:10px;border:1px solid rgba(255,255,255,0.08);" />
          <div>
            <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;font-weight:700;">RNT Infosec LLP</div>
            <h2 style="margin:10px 0 0;font-size:24px;line-height:1.3;color:#ffffff;">Hey, your test is completed.</h2>
          </div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#cbd5e1;">The message below was submitted from the Admin Settings page and delivered using the SMTP credentials provided by the administrator.</p>
          <div style="margin:0 0 18px;padding:18px 20px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.8;color:#f8fafc;">
            ${safeBody}
          </div>
          <div style="margin-top:24px;padding:16px 18px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:13px;line-height:1.8;color:#cbd5e1;">
            <strong style="color:#ffffff;">RNT Infosec LLP</strong> sends this message as confirmation that your scan is completed.
          </div>
        </div>
      </div>
    </div>
  `;
};

const getBrandedLogoAttachment = () => ({
  filename: "RNT_report_LOGO.png",
  path: path.join(__dirname, "..", "images", "RNT_report_LOGO.png"),
  cid: "rnt-logo",
});

const getSeedEmailConfig = () => ({
  provider: DEFAULT_EMAIL_PROVIDER,
  host: DEFAULT_EMAIL_HOST,
  port: DEFAULT_EMAIL_PORT,
  secure: DEFAULT_EMAIL_SECURE,
  username: DEFAULT_EMAIL_USERNAME,
  password: DEFAULT_EMAIL_PASSWORD,
  fromName: DEFAULT_EMAIL_FROM_NAME,
  fromEmail: DEFAULT_EMAIL_FROM_EMAIL,
  isActive: true,
});

const ensureDefaultEmailConfig = async () => {
  const configCount = await EmailConfig.countDocuments();

  if (configCount > 0 || !DEFAULT_EMAIL_USERNAME || !DEFAULT_EMAIL_PASSWORD) {
    return null;
  }

  const existing = await EmailConfig.findOne({
    provider: DEFAULT_EMAIL_PROVIDER,
    host: DEFAULT_EMAIL_HOST,
    username: DEFAULT_EMAIL_USERNAME,
  }).select("+password");

  if (existing) {
    return existing;
  }

  const created = await EmailConfig.create({
    ...getSeedEmailConfig(),
    password: encryptSecret(DEFAULT_EMAIL_PASSWORD),
  });

  return created;
};

const buildEmailTransport = (configDoc) => {
  const password = decryptSecret(configDoc.password) || DEFAULT_EMAIL_PASSWORD;

  return nodemailer.createTransport({
    host: configDoc.host || DEFAULT_EMAIL_HOST,
    port: Number(configDoc.port || DEFAULT_EMAIL_PORT),
    secure: Boolean(configDoc.secure ?? DEFAULT_EMAIL_SECURE),
    auth: {
      user: configDoc.username || DEFAULT_EMAIL_USERNAME,
      pass: password,
    },
  });
};

const buildTransportFromPayload = (payload = {}) => {
  const provider = String(payload.provider || DEFAULT_EMAIL_PROVIDER)
    .trim()
    .toLowerCase();
  const host = String(
    payload.host ||
      (provider === "gmail" ? "smtp.gmail.com" : DEFAULT_EMAIL_HOST),
  ).trim();
  const port = Number(
    payload.port || (provider === "gmail" ? 587 : DEFAULT_EMAIL_PORT),
  );
  const secure =
    payload.secure !== undefined
      ? Boolean(payload.secure)
      : provider === "gmail";
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();

  if (!username || !password) {
    const error = new Error(
      "Username and password are required to send email.",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: username, pass: password },
    }),
    fromName: String(payload.fromName || "").trim(),
    fromEmail: String(payload.fromEmail || "").trim(),
    provider,
  };
};

const listEmailConfigs = async (req, res) => {
  try {
    const configs = await EmailConfig.find()
      .select("+password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        items: configs.map((config) => sanitizeEmailConfig(config)),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load email configs." });
  }
};

const getEmailConfigById = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select(
      "+password",
    );

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
    }

    res.status(200).json({ success: true, data: sanitizeEmailConfig(config) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load email config." });
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

    if (
      !provider ||
      !host ||
      !port ||
      !username ||
      !password ||
      !fromName ||
      !fromEmail
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All SMTP fields are required." });
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
      await EmailConfig.updateMany(
        { _id: { $ne: created._id } },
        { $set: { isActive: false } },
      );
    }

    const saved = await EmailConfig.findById(created._id).select("+password");

    res.status(201).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create email config." });
  }
};

const updateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select(
      "+password",
    );

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
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
    if (password && String(password).trim())
      config.password = encryptSecret(password);
    if (isActive !== undefined) config.isActive = Boolean(isActive);

    await config.save();

    if (config.isActive) {
      await EmailConfig.updateMany(
        { _id: { $ne: config._id } },
        { $set: { isActive: false } },
      );
    }

    const saved = await EmailConfig.findById(config._id).select("+password");

    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update email config." });
  }
};

const deleteEmailConfig = async (req, res) => {
  try {
    const deleted = await EmailConfig.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Email config deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete email config." });
  }
};

const activateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select(
      "+password",
    );

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
    }

    config.isActive = true;
    await config.save();
    await EmailConfig.updateMany(
      { _id: { $ne: config._id } },
      { $set: { isActive: false } },
    );

    const saved = await EmailConfig.findById(config._id).select("+password");
    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to activate email config." });
  }
};

const deactivateEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findById(req.params.id).select(
      "+password",
    );

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
    }

    config.isActive = false;
    await config.save();

    const saved = await EmailConfig.findById(config._id).select("+password");
    res.status(200).json({ success: true, data: sanitizeEmailConfig(saved) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to deactivate email config." });
  }
};

const testEmailConfig = async (req, res) => {
  try {
    const { recipient, subject, body } = req.body;

    if (!recipient || !String(recipient).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Recipient email is required." });
    }

    const config = await EmailConfig.findById(req.params.id).select(
      "+password",
    );

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Email config not found." });
    }

    const transporter = buildEmailTransport(config);
    await transporter.sendMail({
      from: `"${config.fromName || DEFAULT_EMAIL_FROM_NAME}" <${config.fromEmail || config.username || DEFAULT_EMAIL_FROM_EMAIL}>`,
      to: String(recipient).trim(),
      subject: String(subject || "SMTP Test Email").trim(),
      text:
        String(body || "").trim() ||
        "This is a test email from the SEO & SMTP admin settings page.",
      html: `<p>${String(
        body || "This is a test email from the SEO & SMTP admin settings page.",
      )
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />")}</p>`,
    });

    res
      .status(200)
      .json({ success: true, message: "Test email sent successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to send test email." });
  }
};

const sendInlineEmail = async (req, res) => {
  try {
    const {
      recipient,
      subject,
      body,
      provider,
      host,
      port,
      secure,
      username,
      password,
      fromName,
      fromEmail,
    } = req.body;

    if (!recipient || !String(recipient).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Recipient email is required." });
    }

    const {
      transporter,
      fromName: safeFromName,
      fromEmail: safeFromEmail,
    } = buildTransportFromPayload({
      provider,
      host,
      port,
      secure,
      username,
      password,
      fromName,
      fromEmail,
    });

    const resolvedFromEmail = safeFromEmail || username;

    if (!resolvedFromEmail) {
      return res
        .status(400)
        .json({ success: false, message: "From email is required." });
    }

    await transporter.sendMail({
      from: `"${safeFromName || DEFAULT_EMAIL_FROM_NAME}" <${resolvedFromEmail}>`,
      to: String(recipient).trim(),
      subject: String(subject || "SMTP Test Email").trim(),
      text: `Hey ${String(username || "there").trim()}, your test is completed.\n\n${String(body || "").trim() || "This is a test email from the SEO & SMTP admin settings page."}\n\nThanks,\nRNT Infosec LLP`,
      html: buildBrandedEmailTemplate({
        username,
        body:
          String(body || "").trim() ||
          "This is a test email from the SEO & SMTP admin settings page.",
      }),
      attachments: [getBrandedLogoAttachment()],
    });

    res
      .status(200)
      .json({ success: true, message: "Test email sent successfully." });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send test email.",
    });
  }
};

const listSeoSettings = async (req, res) => {
  try {
    const settings = await SeoSetting.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load SEO settings." });
  }
};

const getSeoSettingById = async (req, res) => {
  try {
    const setting = await SeoSetting.findById(req.params.id);

    if (!setting) {
      return res
        .status(404)
        .json({ success: false, message: "SEO setting not found." });
    }

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load SEO setting." });
  }
};

const saveSeoSetting = async (req, res, existingSetting = null) => {
  const route = String(req.body.route || "/").trim() || "/";
  const payload = {
    route,
    pageName: String(req.body.pageName || "Global Settings").trim(),
    metaTitle: String(req.body.metaTitle || "").trim(),
    metaDescription: String(req.body.metaDescription || "").trim(),
    canonicalUrl: String(req.body.canonicalUrl || "").trim(),
    keywords: normalizeKeywords(req.body.keywords),
    openGraph: {
      title: String(req.body.openGraph?.title || "").trim(),
      description: String(req.body.openGraph?.description || "").trim(),
      image: String(req.body.openGraph?.image || "").trim(),
      type: String(req.body.openGraph?.type || "website").trim(),
    },
    twitter: {
      title: String(req.body.twitter?.title || "").trim(),
      description: String(req.body.twitter?.description || "").trim(),
      image: String(req.body.twitter?.image || "").trim(),
      card: String(req.body.twitter?.card || "summary_large_image").trim(),
    },
    isActive:
      req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
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
      return res
        .status(400)
        .json({
          success: false,
          message: "SEO title and description are required.",
        });
    }

    const setting = await saveSeoSetting(req);
    res.status(201).json({ success: true, data: setting });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create SEO setting." });
  }
};

const updateSeoSetting = async (req, res) => {
  try {
    const setting = await SeoSetting.findById(req.params.id);

    if (!setting) {
      return res
        .status(404)
        .json({ success: false, message: "SEO setting not found." });
    }

    if (
      req.body.metaTitle === undefined &&
      req.body.metaDescription === undefined &&
      req.body.openGraph === undefined &&
      req.body.twitter === undefined &&
      req.body.keywords === undefined &&
      req.body.route === undefined &&
      req.body.pageName === undefined &&
      req.body.isActive === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, message: "No SEO fields provided." });
    }

    const updated = await saveSeoSetting(req, setting);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update SEO setting." });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const stats = await Scan.aggregate([
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          totalComponents: { $sum: "$componentCount" },
          totalVulnerabilities: { $sum: "$vulnTotal" },
          criticalVulnerabilities: { $sum: "$vulnCritical" },
          highVulnerabilities: { $sum: "$vulnHigh" },
          runningScans: {
            $sum: { $cond: [{ $eq: ["$status", "running"] }, 1, 0] },
          },
          completedScans: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failedScans: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    const defaultStats = {
      totalScans: 0,
      totalComponents: 0,
      totalVulnerabilities: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      runningScans: 0,
      completedScans: 0,
      failedScans: 0,
    };

    const finalStats = stats.length > 0 ? stats[0] : defaultStats;

    // placeholder for CVE feed, would usually pull from a cache or feed service
    const cveFeed = [
      { cve: "CVE-2024-1234", severity: "High" },
      { cve: "CVE-2024-5678", severity: "Medium" },
      { cve: "CVE-2024-9999", severity: "Critical" },
    ];

    res.status(200).json({
      success: true,
      data: {
        stats: finalStats,
        cveFeed,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin statistics." });
  }
};

module.exports = {
  getAdminStats,
  listEmailConfigs,
  getEmailConfigById,
  createEmailConfig,
  updateEmailConfig,
  deleteEmailConfig,
  activateEmailConfig,
  deactivateEmailConfig,
  testEmailConfig,
  sendInlineEmail,
  listSeoSettings,
  getSeoSettingById,
  createSeoSetting,
  updateSeoSetting,
};

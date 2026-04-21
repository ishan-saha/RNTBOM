"use strict";

const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
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
} = require("../controllers/adminSettingsController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/email-configs", listEmailConfigs);
router.post("/email-configs", createEmailConfig);
router.get("/email-configs/:id", getEmailConfigById);
router.put("/email-configs/:id", updateEmailConfig);
router.patch("/email-configs/:id/activate", activateEmailConfig);
router.patch("/email-configs/:id/deactivate", deactivateEmailConfig);
router.post("/email-configs/:id/test", testEmailConfig);
router.post("/email-configs/test", sendInlineEmail);
router.delete("/email-configs/:id", deleteEmailConfig);

router.get("/seo", listSeoSettings);
router.post("/seo", createSeoSetting);
router.get("/seo/:id", getSeoSettingById);
router.patch("/seo/:id", updateSeoSetting);

module.exports = router;

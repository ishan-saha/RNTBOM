const mongoose = require('mongoose');

const toObjectId = (value) => {
  if (!value) return null;

  try {
    return new mongoose.Types.ObjectId(value.toString());
  } catch {
    return null;
  }
};

const getOrgId = (user) => {
  if (!user) return null;

  const organizationId =
    user.organization && typeof user.organization === 'object'
      ? user.organization._id
      : user.organization;

  return toObjectId(organizationId);
};

const buildReadScanFilter = (user) => {
  if (!user) return {};

  if (user.role === 'admin') {
    return {};
  }

  return { uploadedBy: toObjectId(user._id) };
};

const buildOrgScanFilter = (user) => {
  const organizationId = getOrgId(user);
  return organizationId ? { organization: organizationId } : {};
};

module.exports = {
  getOrgId,
  buildReadScanFilter,
  buildOrgScanFilter,
};
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  getOrgId,
  buildReadScanFilter,
  buildOrgScanFilter,
} = require('../src/utils/scanAccess');

test('admin read filter is unscoped so all scans are visible', () => {
  assert.deepEqual(buildReadScanFilter({ role: 'admin' }), {});
});

test('user read filter scopes to their own scans', () => {
  const userId = new mongoose.Types.ObjectId();
  const filter = buildReadScanFilter({ role: 'user', _id: userId });

  assert.deepEqual(filter, { uploadedBy: userId });
});

test('organization helper supports populated and raw organization values', () => {
  const orgId = new mongoose.Types.ObjectId();

  assert.deepEqual(getOrgId({ organization: { _id: orgId } }), orgId);
  assert.deepEqual(getOrgId({ organization: orgId }), orgId);
});

test('mutation filter still scopes updates to the user organization', () => {
  const orgId = new mongoose.Types.ObjectId();

  assert.deepEqual(buildOrgScanFilter({ organization: { _id: orgId } }), { organization: orgId });
});
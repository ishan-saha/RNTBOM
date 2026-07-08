const BRANDING = {
  companyName: process.env.COMPANY_NAME || 'RNT INFOSEC LLP',
  primaryColor: process.env.PRIMARY_COLOR || '#6366f1',
  secondaryColor: '#4f46e5',
  footerText: process.env.FOOTER_TEXT || 'Confidential — For authorized recipients only',
  preparedBy: process.env.PREPARED_BY || 'Compliance Scanner',
  logoPath: process.env.COMPANY_LOGO_PATH || null,
};

function getBranding(overrides = {}) {
  return { ...BRANDING, ...overrides };
}

module.exports = { getBranding };

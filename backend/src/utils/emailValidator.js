const dns = require("dns").promises;

// Well-known public/personal email providers to block
const PUBLIC_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.in",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "ymail.com",
  "rediffmail.com",
  "zohomail.com",
  "tutanota.com",
  "gmx.com",
  "gmx.net",
]);

/**
 * Validates that an email is a company/business email.
 *
 * Steps:
 *  1. Block well-known public email providers.
 *  2. Verify the domain has MX (mail exchange) records via DNS,
 *     proving the domain is real and can receive email.
 *
 * @param {string} email - The email address to validate.
 * @throws {Error} with a user-friendly message if validation fails.
 */
async function validateCompanyEmail(email) {
  const domain = email.split("@").pop().toLowerCase();

  // Step 1 — block public providers
  if (PUBLIC_DOMAINS.has(domain)) {
    throw new Error(
      "Personal email providers are not allowed. Please use your company email address.",
    );
  }

  // Step 2 — verify domain has valid MX records
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      throw new Error("NO_MX");
    }
  } catch (err) {
    // Re-throw our own messages unchanged
    if (err.message === "NO_MX") {
      throw new Error(
        "Your email domain does not appear to have valid mail records. Please check your company email.",
      );
    }
    // DNS resolution failure (NXDOMAIN, timeout, etc.)
    throw new Error(
      "Could not verify your email domain. Please ensure you are using a valid company email address.",
    );
  }
}

module.exports = { validateCompanyEmail, PUBLIC_DOMAINS };

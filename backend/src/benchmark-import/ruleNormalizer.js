const CHROME_POLICY_DICT = buildChromePolicyDictionary();

function buildChromePolicyDictionary() {
  const dict = {};
  const entries = [
    { display: 'Browser sign-in settings', key: 'BrowserSignin' },
    { display: 'Browser sign in settings', key: 'BrowserSignin' },
    { display: 'Allow Sign-In', key: 'BrowserSignin' },
    { display: 'Allow sign-in', key: 'BrowserSignin' },
    { display: 'Incognito mode availability', key: 'IncognitoModeAvailability' },
    { display: 'Incognito Mode Availability', key: 'IncognitoModeAvailability' },
    { display: 'Password Manager', key: 'PasswordManagerEnabled' },
    { display: 'Password manager', key: 'PasswordManagerEnabled' },
    { display: 'Enable Auto Fill', key: 'AutofillAddressEnabled' },
    { display: 'Auto-fill', key: 'AutofillAddressEnabled' },
    { display: 'Auto Fill', key: 'AutofillAddressEnabled' },
    { display: 'Safe Mode', key: 'SafeBrowsingEnabled' },
    { display: 'Safe Browsing', key: 'SafeBrowsingEnabled' },
    { display: 'Safe browsing', key: 'SafeBrowsingEnabled' },
    { display: 'SafeBrowsing', key: 'SafeBrowsingEnabled' },
    { display: 'Metrics reporting', key: 'MetricsReportingEnabled' },
    { display: 'Metrics Reporting', key: 'MetricsReportingEnabled' },
    { display: 'Sync Disabled', key: 'SyncDisabled' },
    { display: 'Sync disabled', key: 'SyncDisabled' },
    { display: 'Extensions', key: 'ExtensionInstallBlocklist' },
    { display: 'Extension Installation', key: 'ExtensionInstallBlocklist' },
    { display: 'Default pop-ups setting', key: 'DefaultPopupsSetting' },
    { display: 'Notifications', key: 'DefaultNotificationsSetting' },
    { display: 'Default notifications setting', key: 'DefaultNotificationsSetting' },
    { display: 'JavaScript', key: 'DefaultJavaScriptSetting' },
    { display: 'Default JavaScript setting', key: 'DefaultJavaScriptSetting' },
    { display: 'Images', key: 'DefaultImagesSetting' },
    { display: 'Default images setting', key: 'DefaultImagesSetting' },
    { display: 'Cookies', key: 'DefaultCookiesSetting' },
    { display: 'Default cookies setting', key: 'DefaultCookiesSetting' },
    { display: 'Pop-up windows', key: 'DefaultPopupsSetting' },
    { display: 'Pop ups', key: 'DefaultPopupsSetting' },
    { display: 'Block third-party cookies', key: 'BlockThirdPartyCookies' },
    { display: 'Third-party cookies', key: 'BlockThirdPartyCookies' },
    { display: 'Third party cookies', key: 'BlockThirdPartyCookies' },
    { display: 'Payment methods', key: 'PaymentMethodQueryEnabled' },
    { display: 'Payment method', key: 'PaymentMethodQueryEnabled' },
    { display: 'Network prediction', key: 'NetworkPredictionOptions' },
    { display: 'Network Prediction', key: 'NetworkPredictionOptions' },
    { display: 'Search Suggest', key: 'SearchSuggestEnabled' },
    { display: 'Search suggest', key: 'SearchSuggestEnabled' },
    { display: 'Spell check', key: 'SpellCheckServiceEnabled' },
    { display: 'Spell Check', key: 'SpellCheckServiceEnabled' },
    { display: 'Automatically send usage statistics', key: 'MetricsReportingEnabled' },
    { display: 'Usage statistics', key: 'MetricsReportingEnabled' },
    { display: 'Background processing', key: 'BackgroundModeEnabled' },
    { display: 'Background Mode', key: 'BackgroundModeEnabled' },
    { display: 'Developer tools', key: 'DeveloperToolsAvailability' },
    { display: 'Developer Tools', key: 'DeveloperToolsAvailability' },
    { display: 'Default search provider', key: 'DefaultSearchProviderEnabled' },
    { display: 'Search Provider', key: 'DefaultSearchProviderEnabled' },
    { display: 'Search provider', key: 'DefaultSearchProviderEnabled' },
    { display: 'Import bookmarks', key: 'ImportBookmarks' },
    { display: 'Bookmarks', key: 'ImportBookmarks' },
    { display: 'Import browsing history', key: 'ImportHistory' },
    { display: 'Browsing history', key: 'ImportHistory' },
    { display: 'Import passwords', key: 'ImportPasswords' },
    { display: 'Import settings', key: 'ImportSettings' },
    { display: 'Import Search Engine', key: 'ImportSearchEngine' },
    { display: 'Sign-in URL', key: 'SigninUrl' },
    { display: 'Signin URL', key: 'SigninUrl' },
    { display: 'Machine-level User Cloud Policy', key: 'MachineLevelUserCloudPolicyEnrollmentToken' },
    { display: 'Cloud Policy', key: 'CloudPolicyOverridesPlatformPolicy' },
    { display: 'Allow outdated plugins', key: 'AllowOutdatedPlugins' },
    { display: 'Allow Outdated Plugins', key: 'AllowOutdatedPlugins' },
    { display: 'Block External Extensions', key: 'BlockExternalExtensions' },
    { display: 'Extension allowlist', key: 'ExtensionInstallAllowlist' },
    { display: 'Extension blocklist', key: 'ExtensionInstallBlocklist' },
    { display: 'Force installation', key: 'ExtensionInstallForcelist' },
    { display: 'Incognito mode', key: 'IncognitoModeAvailability' },
    { display: 'Privacy Sandbox', key: 'PrivacySandboxPromptEnabled' },
    { display: 'Private Network Access', key: 'PrivateNetworkAccessRestrictionsEnabled' },
    { display: 'URL blocklist', key: 'URLBlocklist' },
    { display: 'URL allowlist', key: 'URLAllowlist' },
    { display: 'Web Bluetooth', key: 'BluetoothAvailability' },
    { display: 'Bluetooth', key: 'BluetoothAvailability' },
    { display: 'WebUSB', key: 'DefaultWebUsbGuardSetting' },
    { display: 'WebXR', key: 'WebXrBlocked' },
    { display: 'File System Write', key: 'FileSystemWriteBlocked' },
    { display: 'Widevine', key: 'WidevineEnabled' },
  ];

  for (const entry of entries) {
    dict[entry.display.toLowerCase()] = entry.key;
  }

  return dict;
}

function extractQuotedStrings(text) {
  const result = [];
  const regex = /"([^"]+)"|'([^']+)'/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    result.push(match[1] || match[2]);
  }
  return result;
}

function normalizeValue(raw) {
  if (raw === undefined || raw === null) return null;

  const lower = String(raw).toLowerCase().trim();

  const booleanMap = {
    'enabled': 'true',
    'disabled': 'false',
    'true': 'true',
    'false': 'false',
    'yes': 'true',
    'no': 'false',
    '1': '1',
    '0': '0',
    'not configured': null,
  };

  if (lower in booleanMap) return booleanMap[lower];

  if (/^\d+$/.test(lower)) return lower;

  return String(raw).trim();
}

function determineConfigSource(title, audit, remediation) {
  const combined = `${title} ${audit} ${remediation}`.toLowerCase();

  if (combined.includes('chrome') || combined.includes('chromium') ||
      combined.includes('google chrome') || combined.includes('chromium browser')) {
    return 'chrome-policy';
  }
  if (combined.includes('registry') || combined.includes('hkcu') ||
      combined.includes('hklm') || combined.includes('reg add') ||
      combined.includes('regedit')) {
    return 'windows-registry';
  }
  if (combined.includes('defaults write') || combined.includes('defaults read') ||
      combined.includes('plist') || combined.includes('com.apple')) {
    return 'mac-plist';
  }
  if (combined.includes('etc/') || combined.includes('/etc/') ||
      combined.includes('.conf') || combined.includes('config file')) {
    return 'file-content';
  }
  if (combined.includes('sysctl') || combined.includes('sysfs')) {
    return 'sysctl';
  }
  if (combined.includes('docker') || combined.includes('container')) {
    return 'docker-config';
  }
  if (combined.includes('kubectl') || combined.includes('kubernetes') ||
      combined.includes('k8s')) {
    return 'kubernetes';
  }
  if (combined.includes('dconf') || combined.includes('gsettings')) {
    return 'dconf';
  }

  return null;
}

function determineOperator(expectedValueStr, comparisonType) {
  if (expectedValueStr === null || expectedValueStr === undefined) return null;

  if (comparisonType === 'boolean') return 'equals';

  if (comparisonType === 'number') {
    if (expectedValueStr.startsWith('>=')) return 'greaterThan';
    if (expectedValueStr.startsWith('<=')) return 'lessThan';
    if (expectedValueStr.startsWith('>')) return 'greaterThan';
    if (expectedValueStr.startsWith('<')) return 'lessThan';
    return 'equals';
  }

  if (comparisonType === 'array') return 'contains';

  if (typeof expectedValueStr === 'string') {
    if (expectedValueStr.startsWith('/') && expectedValueStr.endsWith('/')) return 'regex';
    if (expectedValueStr.includes('*') || expectedValueStr.includes('?')) return 'regex';
  }

  return 'equals';
}

function determineComparisonType(expectedValueStr) {
  if (expectedValueStr === null || expectedValueStr === undefined) return null;

  const str = String(expectedValueStr).toLowerCase();

  if (str === 'true' || str === 'false') return 'boolean';

  if (/^\d+(\.\d+)?$/.test(str.replace(/^[<>]=?\s*/, ''))) return 'number';

  if (str.startsWith('[') && str.endsWith(']')) return 'array';

  return 'string';
}

function extractExpectedValuesFromAudit(audit, title) {
  if (!audit) return null;

  const result = { value: null, supported: [] };

  const regValueMatch = audit.match(/Value\s+(?:Name\s+)?[=:]\s*["']?(\w+)["']?/i);
  if (regValueMatch) {
    result.value = regValueMatch[1];
  }

  const dataMatch = audit.match(/data\s+[=:]\s*["']?(\d+)["']?/i);
  if (dataMatch && !result.value) {
    result.value = dataMatch[1];
  }

  return result.value ? result : null;
}

function extractFromTitle(policyKey, title, audit, remediation) {
  const combined = `${title} ${audit} ${remediation}`;

  const quoted = extractQuotedStrings(combined);
  if (quoted.length < 2) return null;

  const configSource = determineConfigSource(title, audit, remediation);

  let expectedValue = quoted[quoted.length - 1];
  const normalizedValue = normalizeValue(expectedValue);

  if (configSource === 'chrome-policy' && policyKey) {
    const displayName = quoted[0];

    let numericValue = expectedValue;
    const chromeNumericMap = {
      'disabled': '0',
      'enabled': '1',
      'true': '1',
      'false': '0',
      'not configured': null,
      'allow': '0',
      'block': '1',
      'force': '2',
    };

    if (chromeNumericMap[expectedValue.toLowerCase()] !== undefined) {
      numericValue = chromeNumericMap[expectedValue.toLowerCase()];
    }

    const finalValue = normalizeValue(numericValue !== undefined ? numericValue : expectedValue);
    const cType = determineComparisonType(finalValue);
    const op = determineOperator(finalValue, cType);

    return buildComparison(policyKey, op, finalValue, configSource, cType, [], true);
  }

  return null;
}

function extractFromAuditCommands(audit, remediation, title) {
  if (!audit && !remediation) return null;

  const combined = `${audit || ''} ${remediation || ''}`;
  const configSource = determineConfigSource(title, audit || '', remediation || '');

  const regPathMatch = combined.match(/[\\/](Software\\Policies\\\w+[\w\\]*|SOFTWARE\\Policies\\\w+[\w\\]*)/i);
  if (regPathMatch) {
    const parts = regPathMatch[1].split('\\');
    const keyName = parts[parts.length - 1];

    let expectedValue = null;
    const valMatch = combined.match(/Value\s+(?:data\s+)?[=:]\s*["']?(\d+)["']?/i);
    if (valMatch) expectedValue = valMatch[1];

    if (!expectedValue) {
      const nameMatch = combined.match(/(?:reg\s+add|Set-ItemProperty).*?\/v\s+(\w+)/i);
      if (nameMatch) {
        const valDataMatch = combined.match(/\/d\s+["']?(\w+)["']?/i);
        if (valDataMatch) expectedValue = valDataMatch[1];
      }
    }

    if (keyName && expectedValue) {
      const cType = determineComparisonType(expectedValue);
      const op = determineOperator(expectedValue, cType);
      return buildComparison(keyName, op, normalizeValue(expectedValue), configSource, cType, [], true);
    }
  }

  const keyValRegex = /["']([^"']+)["']\s*(?:is\s+)?set\s+to\s+["']([^"']+)["']/i;
  const keyValMatch = combined.match(keyValRegex);
  if (keyValMatch) {
    const cType = determineComparisonType(keyValMatch[2]);
    const op = determineOperator(keyValMatch[2], cType);
    return buildComparison(keyValMatch[1], op, normalizeValue(keyValMatch[2]), configSource, cType, [], true);
  }

  return null;
}

function extractKeyFromTitle(title) {
  const quoted = extractQuotedStrings(title);
  if (quoted.length === 0) return { displayName: null, policyKey: null };

  const displayName = quoted[0];
  const lower = displayName.toLowerCase();

  if (CHROME_POLICY_DICT[lower]) {
    return { displayName, policyKey: CHROME_POLICY_DICT[lower], matched: true };
  }

  const camelCase = displayName
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, c => c.toUpperCase());
  const compactKey = displayName.replace(/[\s_-]/g, '');

  return {
    displayName,
    policyKey: compactKey,
    guessed: true,
  };
}

function buildComparison(key, operator, expectedValue, configSource, comparisonType, supportedValues, isAutomated) {
  return {
    key: key || null,
    operator: operator || null,
    expectedValue: expectedValue !== null && expectedValue !== undefined ? expectedValue : null,
    configSource: configSource || null,
    comparisonType: comparisonType || null,
    supportedValues: supportedValues || [],
    isAutomated: isAutomated || false,
  };
}

function normalizeRule(parsedRule) {
  const { title, audit, remediation, description, status } = parsedRule;
  const combined = `${title} ${audit || ''} ${remediation || ''} ${description || ''}`;

  const keyInfo = extractKeyFromTitle(title);

  let comparison = null;

  const titleResult = extractFromTitle(keyInfo.policyKey, title, audit, remediation);
  if (titleResult) {
    comparison = titleResult;
  }

  if (!comparison) {
    const auditResult = extractFromAuditCommands(audit, remediation, title);
    if (auditResult) {
      comparison = auditResult;
    }
  }

  if (!comparison) {
    const quoted = extractQuotedStrings(combined);
    let expectedValue = null;
    if (quoted.length >= 2) {
      expectedValue = normalizeValue(quoted[quoted.length - 1]);
    }

    const configSource = determineConfigSource(title, audit, remediation);
    const cType = expectedValue ? determineComparisonType(expectedValue) : null;
    const op = expectedValue ? determineOperator(expectedValue, cType) : null;

    comparison = buildComparison(
      keyInfo.policyKey,
      op,
      expectedValue,
      configSource,
      cType,
      [],
      status.assessment === 'Automated',
    );
  }

  if (comparison && comparison.key) {
    comparison.isAutomated = status.assessment === 'Automated';
  }

  return {
    ...parsedRule,
    comparison,
  };
}

module.exports = { normalizeRule };

const SSH_KEY_MAP = {
  'permitrootlogin': 'PermitRootLogin',
  'passwordauthentication': 'PasswordAuthentication',
  'pubkeyauthentication': 'PubkeyAuthentication',
  'pubkeyacceptedalgorithms': 'PubkeyAcceptedAlgorithms',
  'authorizedkeysfile': 'AuthorizedKeysFile',
  'challengeresponseauthentication': 'ChallengeResponseAuthentication',
  'hostkey': 'HostKey',
  'hostkeyalgorithms': 'HostKeyAlgorithms',
  'ignoreuserknownhosts': 'IgnoreUserKnownHosts',
  'kbdinteractiveauthentication': 'KbdInteractiveAuthentication',
  'kerberosauthentication': 'KerberosAuthentication',
  'login Gracetime': 'LoginGraceTime',
  'loglevel': 'LogLevel',
  'maxauthtries': 'MaxAuthTries',
  'maxsessions': 'MaxSessions',
  'maxstartups': 'MaxStartups',
  'port': 'Port',
  'protocol': 'Protocol',
  'strictmodes': 'StrictModes',
  'subsystem': 'Subsystem',
  'syslogfacility': 'SyslogFacility',
  'uselogin': 'UseLogin',
  'useprivilegeseparation': 'UsePrivilegeSeparation',
  'x11displayoffset': 'X11DisplayOffset',
  'x11forwarding': 'X11Forwarding',
  'allowusers': 'AllowUsers',
  'allowgroups': 'AllowGroups',
  'denyusers': 'DenyUsers',
  'denygroups': 'DenyGroups',
  'banner': 'Banner',
  'clientalivecountmax': 'ClientAliveCountMax',
  'clientaliveinterval': 'ClientAliveInterval',
  'compression': 'Compression',
  'gatewayports': 'GatewayPorts',
  'hostbasedauthentication': 'HostbasedAuthentication',
  'listenaddress': 'ListenAddress',
  'macs': 'MACs',
  'usepam': 'UsePAM',
  'ciphers': 'Ciphers',
  'acceptenv': 'AcceptEnv',
  'authenticationmethods': 'AuthenticationMethods',
};

function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = source.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const rawLine = lines[lineNo];
    const line = rawLine.trim();

    if (line === '' || line.startsWith('#')) continue;

    const match = line.match(/^(\w[\w-]*)\s+(.+)/);
    if (!match) {
      warnings.push(`Unrecognized line ${lineNo + 1}: "${rawLine.trim()}"`);
      continue;
    }

    const rawKey = match[1].toLowerCase();
    const value = match[2].trim();

    const mappedKey = SSH_KEY_MAP[rawKey] || rawKey;

    if (config[mappedKey] !== undefined) {
      if (!Array.isArray(config[mappedKey])) {
        config[mappedKey] = [config[mappedKey], value];
      } else {
        config[mappedKey].push(value);
      }
    } else {
      config[mappedKey] = value;
    }
  }

  return { config, warnings };
}

module.exports = {
  name: 'ssh',
  supportedExtensions: ['.ssh_config', 'sshd_config', 'ssh_config'],
  supportedMimes: [],
  detect(content, filePath) {
    if (!filePath) return false;
    const name = filePath.toLowerCase();
    return name.includes('sshd_config') || name.includes('ssh_config') || name.endsWith('.ssh_config');
  },
  parse,
};

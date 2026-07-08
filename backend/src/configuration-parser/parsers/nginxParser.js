const NGINX_DIRECTIVES = new Set([
  'listen', 'server_name', 'root', 'index', 'proxy_pass', 'return',
  'rewrite', 'set', 'deny', 'allow', 'auth_basic', 'auth_basic_user_file',
  'client_max_body_size', 'keepalive_timeout', 'gzip', 'ssl_certificate',
  'ssl_certificate_key', 'ssl_protocols', 'ssl_ciphers', 'ssl_prefer_server_ciphers',
  'add_header', 'error_page', 'location', 'try_files', 'expires',
  'access_log', 'error_log', 'log_format', 'sendfile', 'tcp_nopush',
  'tcp_nodelay', 'server_tokens', 'include', 'fastcgi_pass', 'uwsgi_pass',
  'worker_processes', 'events', 'http', 'server', 'upstream', 'map',
  'types', 'default_type', 'charset', 'source_charset',
  'worker_connections', 'multi_accept', 'use',
  'proxy_set_header', 'proxy_hide_header', 'proxy_redirect',
  'proxy_buffering', 'proxy_buffers', 'proxy_buffer_size',
  'ssl_session_cache', 'ssl_session_timeout', 'ssl_stapling',
  'ssl_stapling_verify', 'resolver', 'resolver_timeout',
]);

function parseBlock(lines, startIdx) {
  const result = {};
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === '' || line.startsWith('#')) {
      i++;
      continue;
    }

    if (line === '}') break;

    const semicolonIdx = line.indexOf(';');
    const braceIdx = line.indexOf('{');

    if (semicolonIdx !== -1 && (braceIdx === -1 || semicolonIdx < braceIdx)) {
      const directive = line.substring(0, semicolonIdx).trim();
      const spaceIdx = directive.indexOf(' ');
      if (spaceIdx !== -1) {
        const key = directive.substring(0, spaceIdx);
        const value = directive.substring(spaceIdx + 1).trim();
        if (NGINX_DIRECTIVES.has(key)) {
          result[key] = value;
        }
      }
      i++;
    } else if (braceIdx !== -1) {
      const directive = line.substring(0, braceIdx).trim();
      const spaceIdx = directive.indexOf(' ');
      const key = spaceIdx !== -1 ? directive.substring(0, spaceIdx) : directive;
      const context = spaceIdx !== -1 ? directive.substring(spaceIdx + 1).trim() : '';

      const nestedStart = i + 1;
      const { result: nested, endIdx } = parseBlock(lines, nestedStart);
      i = endIdx + 1;

      if (key === 'location' && context) {
        const locationKey = `location.${context.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        Object.assign(result, Object.fromEntries(
          Object.entries(nested).map(([k, v]) => [`${locationKey}.${k}`, v])
        ));
      } else if (key === 'server') {
        Object.assign(result, Object.fromEntries(
          Object.entries(nested).map(([k, v]) => [`server.${k}`, v])
        ));
      } else if (key === 'http') {
        Object.assign(result, Object.fromEntries(
          Object.entries(nested).map(([k, v]) => [`http.${k}`, v])
        ));
      } else if (NGINX_DIRECTIVES.has(key)) {
        Object.assign(result, Object.fromEntries(
          Object.entries(nested).map(([k, v]) => [`${key}.${k}`, v])
        ));
      }
    } else {
      i++;
    }
  }

  return { result, endIdx: i };
}

function parse(content, filePath) {
  const warnings = [];
  const config = {};

  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return { config: {}, warnings: ['Empty file'] };
  }

  const source = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = source.split(/\r?\n/);

  try {
    const { result } = parseBlock(lines, 0);
    Object.assign(config, result);
  } catch (err) {
    throw new Error(`Failed to parse nginx config: ${err.message}`);
  }

  if (Object.keys(config).length === 0 && lines.length > 0) {
    warnings.push('No nginx directives could be extracted');
  }

  return { config, warnings };
}

module.exports = {
  name: 'nginx',
  supportedExtensions: ['.nginx', '.nginx.conf', 'nginx.conf'],
  supportedMimes: [],
  detect(content, filePath) {
    if (!filePath) return false;
    const name = filePath.toLowerCase();
    return name.includes('nginx') || name.endsWith('.nginx.conf');
  },
  parse,
};

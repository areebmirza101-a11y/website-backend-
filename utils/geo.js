const geoip = require('geoip-lite');

// Human-readable country names from ISO 3166-1 alpha-2 codes.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

// Normalize whatever we captured (req.ip / x-forwarded-for) down to a single
// routable IPv4/IPv6 address geoip-lite can resolve.
function normalizeIp(raw) {
  if (!raw) return null;
  // x-forwarded-for may be "client, proxy1, proxy2" — the client is first.
  let ip = String(raw).split(',')[0].trim();
  // Express/Node often prefix IPv4 with the IPv6-mapped form "::ffff:".
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip || null;
}

// True for loopback / private / link-local addresses that never resolve to a
// country (localhost in dev, LAN traffic, etc.).
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (/^(fc|fd)/i.test(ip)) return true;    // IPv6 unique-local
  if (/^fe80:/i.test(ip)) return true;      // IPv6 link-local
  return false;
}

function codeToName(code) {
  if (!code) return null;
  try {
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

// Resolve an IP address to { code, name }, or null when it can't be determined
// (private/localhost IP, or geoip has no record).
function lookupCountry(rawIp) {
  const ip = normalizeIp(rawIp);
  if (isPrivateIp(ip)) return null;
  const geo = geoip.lookup(ip);
  if (!geo || !geo.country) return null;
  return { code: geo.country, name: codeToName(geo.country) };
}

// Pull the best-available client IP off an Express request.
function clientIp(req) {
  return req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || null;
}

module.exports = { lookupCountry, clientIp, codeToName, normalizeIp, isPrivateIp };

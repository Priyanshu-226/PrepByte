import crypto from 'node:crypto';

// "Sign in with LeetCode" issues standard HS256 JSON Web Tokens (JWTs), plus the proof-of-ownership codes it relies on.
export const JWT_ISSUER = 'prepbyte';
const HOUR_MS = 3600000;

const b64 = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const hmac = (secret, text) => crypto.createHmac('sha256', secret).update(text);

export function signSession(secret, claims, { now = Date.now(), ttlSeconds = 30 * 86400 } = {}) {
  const iat = Math.floor(now / 1000);
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ ...claims, iss: JWT_ISSUER, iat, exp: iat + ttlSeconds });
  return `${head}.${body}.${hmac(secret, `${head}.${body}`).digest('base64url')}`;
}

// Returns the claims for a valid, unexpired PrepByte JWT, otherwise null (so other tokens, such as Supabase's, fall through).
export function verifySession(secret, token, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  try {
    const header = JSON.parse(Buffer.from(head, 'base64url').toString());
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null; // never accept "none" or other algorithms
    const expected = hmac(secret, `${head}.${body}`).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (claims.iss !== JWT_ISSUER || typeof claims.sub !== 'string' || !(claims.exp > Math.floor(now / 1000))) return null;
    return claims;
  } catch {
    return null;
  }
}

// A code is valid for the hour it was issued in and the next one (so 1 to 2 hours).
export function leetcodeCodes(secret, username, now = Date.now()) {
  const hour = Math.floor(now / HOUR_MS);
  return [hour, hour - 1].map(h => `pb-${hmac(secret, `${username.toLowerCase()}:${h}`).digest('hex').slice(0, 10)}`);
}

export const aboutContainsCode = (about, codes) => typeof about === 'string' && codes.some(code => about.includes(code));

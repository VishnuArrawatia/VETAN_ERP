/**
 * VETAN ERP — Authentication & Authorization module (ESS Security Hardening)
 *
 * Design (per approved plan):
 *  - Passwords: crypto.scrypt (built-in, no new deps). Stored in the SAME
 *    `password` field with a `scrypt$` prefix. Plaintext values (legacy) are
 *    verified as-is and lazily migrated to a hash on first successful login.
 *    Employee-Code default-password behavior is preserved exactly.
 *  - Sessions: HMAC-signed token in an HttpOnly cookie
 *      token = base64url(payload) + "." + base64url(HMAC_SHA256(payload, SESSION_SECRET))
 *      payload = { sub, kind: 'ESS'|'HR', role, rights, epoch, jti, iat, exp }
 *    Revocation is PERSISTENT and MULTI-INSTANCE-SAFE without any new table:
 *    every user/employee record carries `session_epoch`. Logout / password
 *    change / admin reset bumps the epoch (persisted via the existing Supabase
 *    blob + OCC machinery), so every Vercel instance rejects older tokens.
 *  - Authorization: signed-cookie identity ONLY. x-operator-* headers are
 *    display-only and can never authorize anything.
 *  - Guards: requireAuth (any valid session), requireRole(level),
 *    selfOrHR (IDOR check for employee-scoped resources).
 */
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Password hashing (scrypt, lazy migration, zero lockout)
// ---------------------------------------------------------------------------

const SCRYPT_N = 16384, SCRYPT_R = 8, SCRYPT_P = 1, KEYLEN = 64;

export function isHashed(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(plain), salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/** Verify a candidate password against stored value (hash or legacy plaintext). */
export function verifyPassword(entered: string, stored: string | undefined | null): boolean {
  if (!stored) return false;
  if (!isHashed(stored)) return entered === stored; // legacy plaintext path (unchanged behavior)
  try {
    const [tag, n, r, p, saltB64, hashB64] = stored.split('$');
    if (tag !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(String(entered), salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session tokens (HMAC-signed, epoch-revocable)
// ---------------------------------------------------------------------------

export interface SessionPayload {
  sub: string;              // employee id or HR username
  kind: 'ESS' | 'HR';
  role: string;
  rights?: string[];        // HR company rights
  epoch: number;            // must match record.session_epoch at validation time
  jti: string;
  iat: number;
  exp: number;              // epoch-seconds
}

const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h — one shift

function secret(): string {
  return process.env.SESSION_SECRET || 'vetan-dev-secret-rotate-me';
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signSession(payload: Omit<SessionPayload, 'jti' | 'iat' | 'exp'>, ttlSeconds = SESSION_TTL_SECONDS): string {
  const full: SessionPayload = {
    ...payload,
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const body = b64url(JSON.stringify(full));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseSessionCookie(req: any): SessionPayload | null {
  const raw = req.headers?.cookie || '';
  const m = /(?:^|;\s*)vetan_session=([^;]+)/.exec(raw);
  if (!m) return null;
  return verifySessionToken(decodeURIComponent(m[1]));
}

export function sessionCookieHeader(token: string): string {
  return `vetan_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader(): string {
  return 'vetan_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

// ---------------------------------------------------------------------------
// Epoch helpers — persistent revocation via the existing ERP store.
// Records: employees carry session_epoch?; HR users too (users[] entries).
// ---------------------------------------------------------------------------

export function getEpoch(db: any, kind: 'ESS' | 'HR', sub: string): number {
  try {
    if (kind === 'ESS') {
      const emp = (db.data?.employees || []).find((e: any) => e.id === sub);
      return Number(emp?.session_epoch || 0);
    }
    const user = (db.data?.users || []).find((u: any) => u.username === sub || u.id === sub);
    return Number(user?.session_epoch || 0);
  } catch {
    return 0;
  }
}

export async function bumpEpoch(db: any, kind: 'ESS' | 'HR', sub: string): Promise<void> {
  if (kind === 'ESS') {
    const emp = (db.data?.employees || []).find((e: any) => e.id === sub);
    if (emp) emp.session_epoch = Number(emp.session_epoch || 0) + 1;
  } else {
    const user = (db.data?.users || []).find((u: any) => u.username === sub || u.id === sub);
    if (user) user.session_epoch = Number(user.session_epoch || 0) + 1;
  }
  await db.persistDataSync();
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export type AuthLevel = 'PUBLIC' | 'ESS' | 'HR' | 'ADMIN' | 'SUPER_HR';

const HR_ROLES = ['SUPER_HR', 'MANAGEMENT', 'COMPANY_HR'];
const ADMIN_ROLES = ['SUPER_HR', 'MANAGEMENT', 'COMPANY_HR'];

export function roleSatisfies(role: string, level: AuthLevel): boolean {
  switch (level) {
    case 'PUBLIC': return true;
    case 'ESS': return true;                      // any authenticated session
    case 'HR': return HR_ROLES.includes(role) || role === 'AUDITOR'; // auditor = read-only (write-block middleware still applies)
    case 'ADMIN': return ADMIN_ROLES.includes(role);
    case 'SUPER_HR': return role === 'SUPER_HR';
    default: return false;
  }
}

/** Build an express middleware enforcing `level` from the signed cookie. */
export function makeAuthGuard(db: any) {
  return (req: any, res: any, next: any) => {
    const payload = parseSessionCookie(req);
    if (!payload) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    // Persistent revocation: token epoch must match the record's current epoch.
    if (payload.epoch !== getEpoch(db, payload.kind, payload.sub)) {
      return res.status(401).json({ error: 'SESSION_REVOKED' });
    }
    req.ess = payload;
    next();
  };
}

/**
 * Route-level level check (run AFTER makeAuthGuard so req.ess exists).
 * Used by the ROUTE_GUARDS middleware in app.ts.
 */
export function levelAllows(req: any, level: AuthLevel): boolean {
  const role = req.ess?.role || '';
  return roleSatisfies(role, level);
}

/**
 * IDOR protection for employee-scoped resources:
 * allow when the signed session subject matches the requested employee id,
 * OR when the session role has HR authority scoped to that employee's company.
 */
export function selfOrHR(req: any, employeeId: string, employeeCompany?: string): boolean {
  const p = req.ess;
  if (!p) return false;
  if (p.kind === 'ESS' && p.sub.toLowerCase() === String(employeeId).toLowerCase()) return true;
  if (p.kind === 'HR') {
    if (p.role === 'SUPER_HR' || p.role === 'MANAGEMENT' || p.role === 'AUDITOR') return true;
    if (Array.isArray(p.rights) && employeeCompany) return p.rights.includes(employeeCompany);
    return HR_ROLES.includes(p.role); // COMPANY_HR without rights info — deny by default below
  }
  return false;
}

/** Extract the authenticated subject (employee id / HR username) from the signed cookie. */
export function authSub(req: any): string | null {
  return req.ess?.sub || null;
}

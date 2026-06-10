// WorkOS AuthKit helpers. Everything is optional: with no env vars, getWorkos()
// returns null and the callers degrade to public mode.
import { WorkOS } from '@workos-inc/node';

export const COOKIE = 'wos-session';
const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD || '';

export function getWorkos() {
  const key = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!key || !clientId || !cookiePassword) return null;
  return new WorkOS(key, { clientId });
}

export function clientId() { return process.env.WORKOS_CLIENT_ID || ''; }

export function redirectUri(req: any) {
  if (process.env.WORKOS_REDIRECT_URI) return process.env.WORKOS_REDIRECT_URI;
  return origin(req) + '/api/auth/callback';
}

export function origin(req: any) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export function parseCookies(req: any): Record<string, string> {
  const out: Record<string, string> = {};
  (req.headers.cookie || '').split(';').forEach((p: string) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function setSessionCookie(req: any, res: any, value: string) {
  const secure = origin(req).startsWith('https') ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=2592000`);
}

export function clearSessionCookie(req: any, res: any) {
  const secure = origin(req).startsWith('https') ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`);
}

// Returns { id, email } or null. Never throws.
export async function getSessionUser(req: any) {
  const workos = getWorkos();
  if (!workos) return null;
  const sessionData = parseCookies(req)[COOKIE];
  if (!sessionData) return null;
  try {
    const session = workos.userManagement.loadSealedSession({ sessionData, cookiePassword });
    const r = await session.authenticate();
    if (!r.authenticated || !r.user) return null;
    return { id: r.user.id, email: r.user.email };
  } catch (e) {
    return null;
  }
}

export { cookiePassword };

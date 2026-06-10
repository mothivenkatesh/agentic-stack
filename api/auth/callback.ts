// GET /api/auth/callback?code=... -> exchange code, seal session into a cookie,
// upsert the user, redirect back to where they started.
import { getWorkos, clientId, cookiePassword, setSessionCookie, origin } from '../_workos';
import { upsertUser } from '../_db';

export default async function handler(req: any, res: any) {
  const workos = getWorkos();
  const code = req.query && req.query.code;
  let back = '/';
  try { if (req.query && req.query.state) back = Buffer.from(String(req.query.state), 'base64url').toString(); } catch (e) {}
  if (!workos || !code) { res.writeHead(302, { Location: back }); return res.end(); }
  try {
    const r: any = await workos.userManagement.authenticateWithCode({
      code: String(code),
      clientId: clientId(),
      session: { sealSession: true, cookiePassword },
    });
    if (r.sealedSession) setSessionCookie(req, res, r.sealedSession);
    if (r.user) await upsertUser(r.user.id, r.user.email).catch(() => {});
    res.writeHead(302, { Location: back.startsWith('http') ? back : origin(req) + (back.startsWith('/') ? back : '/' + back) });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: back });
    res.end();
  }
}

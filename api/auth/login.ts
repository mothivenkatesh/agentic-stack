// GET /api/auth/login -> redirect to WorkOS AuthKit (passwordless email).
// If WorkOS is not configured, bounce back so the app still works in public mode.
import { getWorkos, clientId, redirectUri } from '../_workos';

export default async function handler(req: any, res: any) {
  const ret = (req.query && req.query.return) || '/';
  const workos = getWorkos();
  if (!workos) { res.writeHead(302, { Location: ret }); return res.end(); }
  try {
    const url = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      clientId: clientId(),
      redirectUri: redirectUri(req),
      state: Buffer.from(String(ret)).toString('base64url'),
    });
    res.writeHead(302, { Location: url });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: ret });
    res.end();
  }
}

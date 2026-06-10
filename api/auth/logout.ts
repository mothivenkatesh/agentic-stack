// GET /api/auth/logout -> clear the session cookie and bounce home.
import { getWorkos, cookiePassword, parseCookies, COOKIE, clearSessionCookie, origin } from '../_workos';

export default async function handler(req: any, res: any) {
  const home = origin(req) + '/';
  const workos = getWorkos();
  clearSessionCookie(req, res);
  if (workos) {
    try {
      const sessionData = parseCookies(req)[COOKIE];
      if (sessionData) {
        const session = workos.userManagement.loadSealedSession({ sessionData, cookiePassword });
        const url = await session.getLogoutUrl();
        if (url) { res.writeHead(302, { Location: url }); return res.end(); }
      }
    } catch (e) {}
  }
  res.writeHead(302, { Location: home });
  res.end();
}

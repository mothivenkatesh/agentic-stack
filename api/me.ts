// GET /api/me -> { user: {id,email} | null }. Public-safe: returns null when
// WorkOS is not configured, so the app stays usable without auth.
import { getSessionUser } from './_workos.js';

export default async function handler(req: any, res: any) {
  const user = await getSessionUser(req).catch(() => null);
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.status(200).end(JSON.stringify({ user }));
}

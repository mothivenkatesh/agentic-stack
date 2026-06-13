// GET/POST/DELETE /api/favorites -> saved pain ids for the signed-in user.
// Degrades to { ok:false } when there is no DB or no session (client uses localStorage).
import { getSql, ensureSchema, readBody } from './_db.js';
import { getSessionUser } from './_workos.js';

export default async function handler(req: any, res: any) {
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  const sql = getSql();
  const user = await getSessionUser(req).catch(() => null);
  if (!sql || !user) {
    res.status(200).end(JSON.stringify({ ok: false, reason: !user ? 'no-auth' : 'no-db', items: [] }));
    return;
  }
  await ensureSchema();
  try {
    if (req.method === 'POST') {
      const { painId } = await readBody(req);
      if (painId) await sql`insert into saved_pains (user_id, pain_id) values (${user.id}, ${painId}) on conflict do nothing`;
    } else if (req.method === 'DELETE') {
      const painId = req.query && req.query.painId;
      if (painId) await sql`delete from saved_pains where user_id = ${user.id} and pain_id = ${painId}`;
    }
    const rows = await sql`select pain_id from saved_pains where user_id = ${user.id} order by created_at desc`;
    res.status(200).end(JSON.stringify({ ok: true, items: rows.map((r: any) => r.pain_id) }));
  } catch (e: any) {
    res.status(200).end(JSON.stringify({ ok: false, reason: 'error', items: [] }));
  }
}

// GET/POST/DELETE /api/prds -> saved PRD drafts for the signed-in user.
// Degrades to { ok:false } when there is no DB or no session (client uses localStorage).
import { getSql, ensureSchema, readBody } from './_db';
import { getSessionUser } from './_workos';

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
      const p = await readBody(req);
      if (p && p.id) {
        await sql`insert into prds (id, user_id, title, pain_id, data, markdown, updated_at)
          values (${p.id}, ${user.id}, ${p.title || 'Untitled PRD'}, ${p.painId || null}, ${JSON.stringify(p.data || {})}, ${p.markdown || ''}, now())
          on conflict (id) do update set title = excluded.title, pain_id = excluded.pain_id, data = excluded.data, markdown = excluded.markdown, updated_at = now()`;
      }
    } else if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (id) await sql`delete from prds where user_id = ${user.id} and id = ${id}`;
    }
    const rows = await sql`select id, title, pain_id, data, markdown, updated_at from prds where user_id = ${user.id} order by updated_at desc`;
    res.status(200).end(JSON.stringify({ ok: true, items: rows }));
  } catch (e: any) {
    res.status(200).end(JSON.stringify({ ok: false, reason: 'error', items: [] }));
  }
}

// Neon Postgres helpers. Optional: with no DATABASE_URL, getSql() returns null
// and callers degrade (the client keeps using localStorage).
import { neon } from '@neondatabase/serverless';

let _sql: any = null;
let _ensured = false;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!_sql) _sql = neon(url);
  return _sql;
}

export async function ensureSchema() {
  const sql = getSql();
  if (!sql || _ensured) return;
  _ensured = true;
  await sql`create table if not exists users (id text primary key, email text not null, created_at timestamptz not null default now())`;
  await sql`create table if not exists saved_pains (user_id text not null, pain_id text not null, created_at timestamptz not null default now(), primary key (user_id, pain_id))`;
  await sql`create table if not exists prds (id text primary key, user_id text not null, title text not null, pain_id text, data jsonb not null, markdown text not null, updated_at timestamptz not null default now())`;
}

export async function upsertUser(id: string, email: string) {
  const sql = getSql();
  if (!sql) return;
  await ensureSchema();
  await sql`insert into users (id, email) values (${id}, ${email}) on conflict (id) do update set email = excluded.email`;
}

export async function readBody(req: any): Promise<any> {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c: any) => (d += c));
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

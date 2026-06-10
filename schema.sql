-- Agentic Stack Postgres schema (Neon). Run once: psql "$DATABASE_URL" -f schema.sql
-- Public data (pains, skills, stack rules) lives in /data JSON, NOT here.
-- These tables only hold per-user state, keyed by the WorkOS user id.

create table if not exists users (
  id          text primary key,            -- WorkOS user id
  email       text not null,
  created_at  timestamptz not null default now()
);

create table if not exists saved_pains (
  user_id     text not null references users(id) on delete cascade,
  pain_id     text not null,               -- idea-box PAIN-xxxx id
  created_at  timestamptz not null default now(),
  primary key (user_id, pain_id)
);

create table if not exists prds (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(id) on delete cascade,
  title       text not null,
  pain_id     text,                         -- optional source pain
  data        jsonb not null,               -- the structured form state
  markdown    text not null,                -- rendered PRD
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists stack_choices (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(id) on delete cascade,
  pain_id     text,
  answers     jsonb not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists prds_user_idx on prds(user_id, updated_at desc);
create index if not exists stack_user_idx on stack_choices(user_id, created_at desc);

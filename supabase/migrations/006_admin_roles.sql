-- 006: role-based admin. Additive / non-destructive. NOT applied (BLOCKERS B3).
-- Admins are granted by the owner only (SQL editor / service role); no client write policies exist.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='admin_users' and policyname='admin_users_self_read') then
    create policy admin_users_self_read on public.admin_users for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  imported integer not null default 0,
  updated integer not null default 0,
  skipped integer not null default 0,
  ok boolean,
  error text
);
alter table public.ingestion_runs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ingestion_runs' and policyname='ingestion_runs_admin_read') then
    create policy ingestion_runs_admin_read on public.ingestion_runs for select to authenticated
      using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
  end if;
end $$;

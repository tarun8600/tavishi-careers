create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, headline text, skills text[] not null default '{}', created_at timestamptz not null default now());
create table public.jobs (id uuid primary key default gen_random_uuid(), title text not null, company text not null, location text, description text, apply_url text, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.resumes (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, filename text not null, storage_path text not null, created_at timestamptz not null default now());
create table public.applications (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, job_id uuid not null references public.jobs(id), resume_id uuid references public.resumes(id), status text not null default 'draft' check (status in ('draft','ready','approved','submitted','external_pending','interview','offer','rejected','withdrawn','failed')), approved_at timestamptz, created_at timestamptz not null default now());
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
create policy profiles_own_select on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profiles_own_insert on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profiles_own_update on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy jobs_public_read on public.jobs for select to anon,authenticated using (is_active);
create policy resumes_own_read on public.resumes for select to authenticated using ((select auth.uid())=user_id);
create policy resumes_own_insert on public.resumes for insert to authenticated with check ((select auth.uid())=user_id);
create policy resumes_own_delete on public.resumes for delete to authenticated using ((select auth.uid())=user_id);
create policy applications_own_read on public.applications for select to authenticated using ((select auth.uid())=user_id);
-- Intentionally no client-side application INSERT/UPDATE grants: use authenticated server APIs with validation and immutable approval snapshots.

-- 004: saved jobs, resume metadata and private resume storage. Additive / non-destructive. NOT applied (BLOCKERS B3).
create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.saved_jobs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_jobs' and policyname='saved_jobs_own_select') then
    create policy saved_jobs_own_select on public.saved_jobs for select to authenticated using ((select auth.uid()) = user_id);
    create policy saved_jobs_own_insert on public.saved_jobs for insert to authenticated with check ((select auth.uid()) = user_id);
    create policy saved_jobs_own_delete on public.saved_jobs for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

alter table public.resumes add column if not exists label text check (label is null or char_length(label) <= 80);
alter table public.resumes add column if not exists mime_type text;
alter table public.resumes add column if not exists size_bytes integer check (size_bytes is null or size_bytes between 1 and 5242880);
alter table public.resumes add column if not exists is_default boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='resumes' and policyname='resumes_own_update') then
    create policy resumes_own_update on public.resumes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end $$;

-- Private bucket: 5 MB, PDF/DOCX only; objects live under "<user_id>/".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='resumes_owner_rw') then
    create policy resumes_owner_rw on storage.objects for all to authenticated
      using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
      with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

-- 005: application status history, interview + follow-up tracking. Additive / non-destructive. NOT applied (BLOCKERS B3).
alter table public.applications add column if not exists interview_at timestamptz;
alter table public.applications add column if not exists follow_up_at timestamptz;
alter table public.applications add column if not exists updated_at timestamptz not null default now();

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events (application_id, created_at desc);
alter table public.application_events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='application_events' and policyname='application_events_own_read') then
    create policy application_events_own_read on public.application_events for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;
-- No client INSERT/UPDATE/DELETE policies: events are append-only via the function below.

create or replace function public.record_application_event(
  p_application_id uuid, p_status text, p_note text, p_interview_at timestamptz, p_follow_up_at timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_from text; v_event uuid;
begin
  select status into v_from from public.applications where id = p_application_id and user_id = auth.uid() for update;
  if v_from is null then raise exception 'application not found'; end if;
  if not (
    (v_from in ('submitted','external_pending') and p_status in ('interview','rejected','withdrawn')) or
    (v_from = 'interview' and p_status in ('interview','offer','rejected','withdrawn')) or
    (v_from = 'offer' and p_status = 'withdrawn')
  ) then raise exception 'transition not allowed'; end if;
  update public.applications set status = p_status, interview_at = coalesce(p_interview_at, interview_at),
    follow_up_at = p_follow_up_at, updated_at = now() where id = p_application_id;
  insert into public.application_events (application_id, user_id, from_status, to_status, note)
    values (p_application_id, auth.uid(), v_from, p_status, p_note) returning id into v_event;
  return v_event;
end $$;
revoke all on function public.record_application_event(uuid, text, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.record_application_event(uuid, text, text, timestamptz, timestamptz) to authenticated;

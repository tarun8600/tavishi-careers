-- 003: worldwide job attributes for search filters. Additive and non-destructive:
-- only ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS; existing rows (incl. international) are preserved,
-- new columns are NULL until real ingestion populates them. NOT applied to any live database (BLOCKERS B3).
alter table public.jobs add column if not exists country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.jobs add column if not exists region text;
alter table public.jobs add column if not exists city text;
alter table public.jobs add column if not exists workplace_type text check (workplace_type is null or workplace_type in ('remote','hybrid','onsite'));
alter table public.jobs add column if not exists employment_type text check (employment_type is null or employment_type in ('full_time','part_time','contract','temporary','internship','freelance'));
alter table public.jobs add column if not exists seniority text check (seniority is null or seniority in ('intern','entry','mid','senior','lead','manager','director','executive'));
alter table public.jobs add column if not exists industry text;
alter table public.jobs add column if not exists salary_min numeric check (salary_min is null or salary_min >= 0);
alter table public.jobs add column if not exists salary_max numeric check (salary_max is null or salary_max >= 0);
alter table public.jobs add column if not exists salary_currency text check (salary_currency is null or salary_currency ~ '^[A-Z]{3}$');
alter table public.jobs add column if not exists salary_period text check (salary_period is null or salary_period in ('hour','day','month','year'));
alter table public.jobs add column if not exists posted_at timestamptz;
alter table public.jobs add column if not exists source text;
alter table public.jobs add column if not exists source_job_id text;

create index if not exists jobs_active_country_posted_idx on public.jobs (country_code, posted_at desc) where is_active;
create index if not exists jobs_active_workplace_idx on public.jobs (workplace_type) where is_active;
create index if not exists jobs_active_employment_idx on public.jobs (employment_type) where is_active;
create index if not exists jobs_active_seniority_idx on public.jobs (seniority) where is_active;
create index if not exists jobs_active_salary_idx on public.jobs (salary_currency, salary_max) where is_active;
create unique index if not exists jobs_source_unique_idx on public.jobs (source, source_job_id) where source is not null and source_job_id is not null;

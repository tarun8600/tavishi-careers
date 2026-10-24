-- 002: profile onboarding fields. Additive and non-destructive (no drops, no data changes).
-- NOT applied to any live database; requires owner approval (docs/BLOCKERS.md B3).
alter table public.profiles add column if not exists country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.profiles add column if not exists city text check (city is null or char_length(city) <= 100);
alter table public.profiles add column if not exists preferred_workplace text not null default 'any' check (preferred_workplace in ('remote','hybrid','onsite','any'));
alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

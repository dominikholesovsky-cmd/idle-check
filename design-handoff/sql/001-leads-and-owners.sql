-- Idle Check: leads and report owners.
-- Run this yourself in Supabase, SQL Editor, before phase 5. Claude Code must not run DDL.
--
-- Privacy design: NO policies on either table. Row Level Security is on, so the anon key (which is
-- public in the browser bundle) cannot read or write them. Only the service role key used by server
-- functions can. Do not add a public policy. Do not store email in "reports" or in report_json,
-- because /report/:id is read in the browser with the anon key and "reports" has a public SELECT policy.

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,                 -- always stored trimmed and lowercased by the app
  marketing_opt_in boolean not null default false,
  consent_text     text,                          -- exact wording the user saw when opting in
  consented_at     timestamptz,
  source           text not null default 'landing',
  created_at       timestamptz not null default now(),
  unsubscribed_at  timestamptz,
  constraint leads_email_key unique (email),
  constraint leads_email_len check (char_length(email) <= 254)
);
alter table public.leads enable row level security;

create table if not exists public.report_owners (
  report_id  uuid primary key references public.reports(id) on delete cascade,
  lead_id    uuid not null references public.leads(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists report_owners_lead_idx on public.report_owners (lead_id);
alter table public.report_owners enable row level security;

-- Check afterwards (both must return no rows when run with the anon key):
--   select * from public.leads limit 1;
--   select * from public.report_owners limit 1;

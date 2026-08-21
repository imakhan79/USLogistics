create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  name text not null,
  stage text not null default 'lead' check (stage in ('lead', 'qualified', 'quoting', 'negotiation', 'won', 'lost')),
  estimated_value numeric not null default 0,
  probability_pct numeric not null default 20 check (probability_pct between 0 and 100),
  expected_close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_tenant_stage_idx on public.opportunities (tenant_id, stage);

alter table public.opportunities enable row level security;

create policy "opportunities_select" on public.opportunities
  for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy "opportunities_write" on public.opportunities
  for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin', 'dispatcher'))
  with check (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin', 'dispatcher'));

create trigger set_opportunities_updated_at
  before update on public.opportunities
  for each row execute function extensions.moddatetime(updated_at);

-- Let communications attach to a customer directly (CRM notes/calls/emails),
-- not just a load.
alter table public.communications alter column load_id drop not null;
alter table public.communications add column customer_id uuid references public.customers (id) on delete cascade;
alter table public.communications add constraint communications_has_subject
  check (load_id is not null or customer_id is not null);

create index communications_customer_idx on public.communications (customer_id);

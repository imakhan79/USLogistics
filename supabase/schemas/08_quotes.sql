create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  quote_number text not null,
  customer_id uuid references public.customers (id) on delete set null,
  origin_summary text not null,
  destination_summary text not null,
  equipment_type text not null default 'Dry Van',
  commodity text,
  weight_lbs numeric,
  miles numeric not null default 0,
  deadhead_miles numeric not null default 0,

  carrier_cost_estimate numeric not null default 0,
  fuel_cost_estimate numeric not null default 0,
  deadhead_cost_estimate numeric not null default 0,
  accessorial_cost_estimate numeric not null default 0,
  other_cost_estimate numeric not null default 0,
  total_cost_estimate numeric generated always as (
    carrier_cost_estimate + fuel_cost_estimate + deadhead_cost_estimate + accessorial_cost_estimate + other_cost_estimate
  ) stored,

  target_margin_pct numeric not null default 20,
  recommended_rate numeric,
  minimum_rate numeric,
  expected_margin numeric generated always as (
    coalesce(recommended_rate, 0) - (carrier_cost_estimate + fuel_cost_estimate + deadhead_cost_estimate + accessorial_cost_estimate + other_cost_estimate)
  ) stored,
  risk_score numeric not null default 0,

  ai_rationale text,
  ai_model text,

  status text not null default 'draft' check (status in ('draft', 'quoted', 'sent', 'approved', 'rejected', 'converted', 'expired')),
  converted_load_id uuid references public.loads (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number)
);

create index quotes_tenant_status_idx on public.quotes (tenant_id, status);

alter table public.quotes enable row level security;

create policy "quotes_tenant_isolation" on public.quotes
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute function extensions.moddatetime(updated_at);

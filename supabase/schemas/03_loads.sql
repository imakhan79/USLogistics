create table public.loads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_number text not null,
  customer_id uuid references public.customers (id) on delete set null,
  carrier_id uuid references public.carriers (id) on delete set null,
  driver_id uuid references public.drivers (id) on delete set null,
  truck_id uuid references public.trucks (id) on delete set null,
  status text not null default 'booked' check (status in ('booked', 'covered', 'pickup', 'in_transit', 'delivered', 'cancelled')),
  equipment_type text,
  commodity text,
  weight_lbs numeric,
  pallets int,
  origin_summary text,
  destination_summary text,
  revenue numeric not null default 0,
  carrier_cost numeric not null default 0,
  margin numeric generated always as (revenue - carrier_cost) stored,
  risk_score numeric not null default 0,
  risk_level text not null default 'ok' check (risk_level in ('ok', 'warning', 'critical')),
  pickup_date timestamptz,
  delivery_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, load_number)
);

create index loads_tenant_status_idx on public.loads (tenant_id, status);

create table public.load_stops (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid not null references public.loads (id) on delete cascade,
  stop_type text not null check (stop_type in ('pickup', 'delivery')),
  sequence int not null default 1,
  address text,
  city text,
  state text,
  zip text,
  lat numeric,
  lng numeric,
  scheduled_at timestamptz,
  actual_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'delayed')),
  created_at timestamptz not null default now()
);

create index load_stops_load_idx on public.load_stops (load_id);

create table public.load_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid not null references public.loads (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid not null references public.loads (id) on delete cascade,
  type text not null check (type in ('email', 'call', 'sms', 'note')),
  subject text,
  body text,
  from_user_id uuid references public.profiles (id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.loads enable row level security;
alter table public.load_stops enable row level security;
alter table public.load_status_history enable row level security;
alter table public.communications enable row level security;

create policy "loads_tenant_isolation" on public.loads
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "load_stops_tenant_isolation" on public.load_stops
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "load_status_history_tenant_isolation" on public.load_status_history
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "communications_tenant_isolation" on public.communications
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create trigger set_loads_updated_at
  before update on public.loads
  for each row execute function extensions.moddatetime(updated_at);

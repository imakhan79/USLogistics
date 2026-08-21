-- Customers, carriers, drivers, trucks: the operational directory.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  billing_address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.carriers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  mc_number text,
  dot_number text,
  contact_name text,
  contact_email text,
  contact_phone text,
  safety_rating text,
  insurance_expiry date,
  status text not null default 'active' check (status in ('active', 'inactive', 'flagged')),
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  carrier_id uuid references public.carriers (id) on delete set null,
  name text not null,
  phone text,
  email text,
  license_number text,
  license_expiry date,
  status text not null default 'active' check (status in ('active', 'off_duty', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  unit_number text not null,
  equipment_type text not null default 'truck' check (equipment_type in ('truck', 'trailer')),
  make text,
  model text,
  year int,
  plate text,
  status text not null default 'available' check (status in ('available', 'in_transit', 'maintenance', 'out_of_service')),
  current_driver_id uuid references public.drivers (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.carriers enable row level security;
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;

create policy "customers_tenant_isolation" on public.customers
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "carriers_tenant_isolation" on public.carriers
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "drivers_tenant_isolation" on public.drivers
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "trucks_tenant_isolation" on public.trucks
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

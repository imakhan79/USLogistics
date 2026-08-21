-- Core extensions used across the schema.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists moddatetime with schema extensions;
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'dispatcher', 'driver', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Reusable helper: current user's tenant. Safe from recursion because
-- profiles' own RLS policy is keyed on id = auth.uid(), not tenant_id.
create function public.current_tenant_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create policy "tenants_select_own" on public.tenants
  for select to authenticated
  using (id = public.current_tenant_id());

-- New auth user -> create a tenant + owner profile automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
begin
  insert into public.tenants (name, slug)
  values (
    coalesce(new.raw_user_meta_data ->> 'company_name', split_part(new.email, '@', 1)) || '''s Fleet',
    lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'company_name', split_part(new.email, '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
  )
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name, role)
  values (new.id, new_tenant_id, new.raw_user_meta_data ->> 'full_name', 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
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
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid references public.loads (id) on delete cascade,
  carrier_id uuid references public.carriers (id) on delete cascade,
  name text not null,
  doc_type text not null default 'other' check (doc_type in ('rate_confirmation', 'bol', 'pod', 'invoice', 'insurance_certificate', 'w9', 'other')),
  file_url text,
  status text not null default 'pending' check (status in ('pending', 'validated', 'active', 'expired')),
  ocr_text text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  expires_at date,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "documents_tenant_isolation" on public.documents
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create table public.exceptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid not null references public.loads (id) on delete cascade,
  severity text not null check (severity in ('warning', 'critical')),
  category text not null default 'other' check (category in ('carrier_cancellation', 'late_pickup', 'low_margin', 'missing_documents', 'other')),
  issue_summary text not null,
  sla_deadline timestamptz,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index exceptions_tenant_status_idx on public.exceptions (tenant_id, status);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  load_id uuid references public.loads (id) on delete cascade,
  exception_id uuid references public.exceptions (id) on delete cascade,
  recommendation_text text not null,
  action_type text not null default 'other' check (action_type in ('assign_carrier', 'optimize_backhaul', 'cover_load', 'other')),
  estimated_cost numeric,
  estimated_delay_minutes int,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 1),
  model text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.exceptions enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "exceptions_tenant_isolation" on public.exceptions
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "ai_recommendations_tenant_isolation" on public.ai_recommendations
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  load_id uuid references public.loads (id) on delete set null,
  invoice_number text not null,
  amount numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  due_date date,
  issued_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

alter table public.invoices enable row level security;

create policy "invoices_tenant_isolation" on public.invoices
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

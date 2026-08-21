alter table public.loads add column miles numeric;

alter table public.drivers add column pay_type text not null default 'percentage' check (pay_type in ('per_mile', 'percentage', 'fixed'));
alter table public.drivers add column pay_rate numeric not null default 0.65;
comment on column public.drivers.pay_rate is
  'per_mile: dollars per mile. percentage: decimal fraction of load revenue (0.65 = 65%). fixed: flat dollars per load.';

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  load_count int not null default 0,
  gross_pay numeric not null default 0,
  bonus numeric not null default 0,
  fuel_deduction numeric not null default 0,
  tolls_deduction numeric not null default 0,
  advances_deduction numeric not null default 0,
  expenses_deduction numeric not null default 0,
  other_deductions numeric not null default 0,
  net_pay numeric generated always as (
    gross_pay + bonus - fuel_deduction - tolls_deduction - advances_deduction - expenses_deduction - other_deductions
  ) stored,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid')),
  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index settlements_tenant_driver_idx on public.settlements (tenant_id, driver_id);

alter table public.settlements enable row level security;

create policy "settlements_select" on public.settlements
  for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy "settlements_write" on public.settlements
  for all to authenticated
  using (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin'))
  with check (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin'));

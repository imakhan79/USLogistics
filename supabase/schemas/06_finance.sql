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

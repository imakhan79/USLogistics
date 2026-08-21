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

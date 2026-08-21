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

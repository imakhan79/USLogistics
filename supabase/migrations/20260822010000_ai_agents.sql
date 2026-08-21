create table public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  key text not null,
  name text not null,
  description text not null,
  autonomy_level int not null default 1 check (autonomy_level between 0 and 3),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);

comment on column public.ai_agents.autonomy_level is
  '0=human only, 1=AI insight, 2=AI recommendation, 3=AI executes after approval. Level 4 (fully autonomous execution) from the BRD is intentionally not offered yet — no agent in this build executes financial or dispatch actions without a human clicking Approve.';

alter table public.ai_agents enable row level security;

create policy "ai_agents_tenant_isolation" on public.ai_agents
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

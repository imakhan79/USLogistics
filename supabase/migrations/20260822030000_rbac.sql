-- Role-based access control at the database layer.
--
-- Every table so far only checked tenant_id in RLS, meaning any authenticated
-- tenant member — including 'driver' or 'viewer' — could write to any table
-- by calling the API directly, regardless of what the UI shows them. Worse,
-- profiles_update_own allowed a user to update their own role and tenant_id,
-- meaning a viewer could self-promote to owner or hop into another tenant's
-- data with a single REST call. This file closes both gaps.

create function public.current_user_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Prevent privilege escalation: nobody can move their own row to another
-- tenant, and only owner/admin can change any profile's role (including
-- their own — an owner demoting themselves is a deliberate act, not a bug).
create function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tenant_id <> old.tenant_id then
    raise exception 'tenant_id cannot be changed';
  end if;
  if new.role <> old.role and public.current_user_role() not in ('owner', 'admin') then
    raise exception 'only owner or admin can change a role';
  end if;
  return new;
end;
$$;

create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- profiles: readable tenant-wide (needed for any future team directory /
-- "changed by" attribution); writable on your own row, or any row in your
-- tenant if you're owner/admin (the trigger above still blocks role/tenant
-- abuse even here).
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or tenant_id = public.current_tenant_id());

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin')))
  with check (id = auth.uid() or (tenant_id = public.current_tenant_id() and public.current_user_role() in ('owner', 'admin')));

-- tenants: owner can update tenant settings (name/slug) once that UI exists.
create policy "tenants_update" on public.tenants
  for update to authenticated
  using (id = public.current_tenant_id() and public.current_user_role() = 'owner')
  with check (id = public.current_tenant_id() and public.current_user_role() = 'owner');

-- Tier A: operational data. Everyone in the tenant can read; only
-- owner/admin/dispatcher can write. Driver and viewer are read-only.
drop policy if exists "loads_tenant_isolation" on public.loads;
drop policy if exists "load_stops_tenant_isolation" on public.load_stops;
drop policy if exists "exceptions_tenant_isolation" on public.exceptions;
drop policy if exists "ai_recommendations_tenant_isolation" on public.ai_recommendations;
drop policy if exists "communications_tenant_isolation" on public.communications;
drop policy if exists "load_status_history_tenant_isolation" on public.load_status_history;
drop policy if exists "documents_tenant_isolation" on public.documents;
drop policy if exists "quotes_tenant_isolation" on public.quotes;

do $$
declare
  t text;
begin
  foreach t in array array['loads', 'load_stops', 'exceptions', 'ai_recommendations', 'communications', 'load_status_history', 'documents', 'quotes']
  loop
    execute format(
      'create policy "%s_select" on public.%I for select to authenticated using (tenant_id = public.current_tenant_id())',
      t, t
    );
    execute format(
      'create policy "%s_write" on public.%I for all to authenticated
         using (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin'', ''dispatcher''))
         with check (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin'', ''dispatcher''))',
      t, t
    );
  end loop;
end $$;

-- Tier B: operational directory (customers/carriers/drivers/trucks) — same
-- access shape as Tier A.
drop policy if exists "customers_tenant_isolation" on public.customers;
drop policy if exists "carriers_tenant_isolation" on public.carriers;
drop policy if exists "drivers_tenant_isolation" on public.drivers;
drop policy if exists "trucks_tenant_isolation" on public.trucks;

do $$
declare
  t text;
begin
  foreach t in array array['customers', 'carriers', 'drivers', 'trucks']
  loop
    execute format(
      'create policy "%s_select" on public.%I for select to authenticated using (tenant_id = public.current_tenant_id())',
      t, t
    );
    execute format(
      'create policy "%s_write" on public.%I for all to authenticated
         using (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin'', ''dispatcher''))
         with check (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin'', ''dispatcher''))',
      t, t
    );
  end loop;
end $$;

-- Tier C/D: financial data and AI governance are the most sensitive writes —
-- owner/admin only. Everyone in the tenant can still read.
drop policy if exists "invoices_tenant_isolation" on public.invoices;
drop policy if exists "ai_agents_tenant_isolation" on public.ai_agents;

do $$
declare
  t text;
begin
  foreach t in array array['invoices', 'ai_agents']
  loop
    execute format(
      'create policy "%s_select" on public.%I for select to authenticated using (tenant_id = public.current_tenant_id())',
      t, t
    );
    execute format(
      'create policy "%s_write" on public.%I for all to authenticated
         using (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin''))
         with check (tenant_id = public.current_tenant_id() and public.current_user_role() in (''owner'', ''admin''))',
      t, t
    );
  end loop;
end $$;

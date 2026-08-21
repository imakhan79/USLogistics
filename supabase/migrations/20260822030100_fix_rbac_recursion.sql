-- Fixes infinite recursion introduced by the RBAC migration: current_tenant_id()
-- and current_user_role() are called from RLS policies on the profiles table
-- itself (via the OR-based tenant-wide SELECT policy). Postgres does not
-- guarantee short-circuit evaluation of OR'd RLS quals, so a SECURITY INVOKER
-- helper that queries profiles can re-trigger the same policy and recurse
-- until "stack depth limit exceeded". Switching both to SECURITY DEFINER makes
-- their internal lookup bypass RLS, breaking the cycle.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

revoke execute on function public.current_tenant_id() from public;
grant execute on function public.current_tenant_id() to authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke execute on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

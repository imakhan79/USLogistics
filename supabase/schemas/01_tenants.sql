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

-- Reusable helper: current user's tenant. SECURITY DEFINER so this lookup
-- bypasses RLS on profiles entirely — profiles' SELECT policy itself calls
-- this function (to allow viewing tenant-mates), and Postgres does not
-- guarantee short-circuit evaluation of OR'd RLS quals, so a SECURITY
-- INVOKER version here would recurse into profiles_select and blow the
-- stack. Kept to a single narrow, parameterless lookup — safe to bypass RLS
-- for.
create function public.current_tenant_id()
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

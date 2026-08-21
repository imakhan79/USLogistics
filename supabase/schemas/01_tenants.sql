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

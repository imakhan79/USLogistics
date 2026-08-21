-- Dev-only: seeds pre-confirmed demo auth users (one per role) directly into
-- auth.users, since we don't have a service_role key to use the Admin API.
-- Password for every demo account: Demo12345!
--
-- We can't disable the on_auth_user_created trigger (no ALTER privilege on
-- auth.users), so each insert lets it create its own throwaway tenant, then
-- we delete that tenant (cascades the profile) and re-point the user at the
-- shared demo tenant with the correct role.

do $$
declare
  t_id uuid;
  u_id uuid;
  auto_tenant_id uuid;
  demo_users jsonb := '[
    {"email":"owner@demo.freight.co","role":"owner","name":"Olivia Owner"},
    {"email":"admin@demo.freight.co","role":"admin","name":"Adam Admin"},
    {"email":"dispatcher@demo.freight.co","role":"dispatcher","name":"Dana Dispatcher"},
    {"email":"driver@demo.freight.co","role":"driver","name":"Derek Driver"},
    {"email":"viewer@demo.freight.co","role":"viewer","name":"Vera Viewer"}
  ]'::jsonb;
  u jsonb;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';

  for u in select * from jsonb_array_elements(demo_users) loop
    select id into u_id from auth.users where email = u->>'email';

    if u_id is null then
      u_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        is_sso_user, is_anonymous
      ) values (
        '00000000-0000-0000-0000-000000000000', u_id, 'authenticated', 'authenticated',
        u->>'email', crypt('Demo12345!', gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', u->>'name'),
        now(), now(),
        '', '', '', '',
        false, false
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), u_id, u_id::text,
        jsonb_build_object('sub', u_id::text, 'email', u->>'email'),
        'email', now(), now(), now()
      );

      -- the on_auth_user_created trigger just created its own tenant + profile; discard the tenant.
      select tenant_id into auto_tenant_id from public.profiles where id = u_id;
      if auto_tenant_id is not null and auto_tenant_id <> t_id then
        delete from public.tenants where id = auto_tenant_id;
      end if;
    end if;

    insert into public.profiles (id, tenant_id, full_name, role)
    values (u_id, t_id, u->>'name', u->>'role')
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role, full_name = excluded.full_name;
  end loop;
end $$;

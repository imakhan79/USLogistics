-- Private storage bucket for documents. Objects are stored under
-- "<tenant_id>/<uuid>.<ext>" — the first path segment is the tenant id,
-- which every policy below checks via storage.foldername(name).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 26214400,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "documents_bucket_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_tenant_id()::text);

create policy "documents_bucket_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_user_role() in ('owner', 'admin', 'dispatcher')
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_user_role() in ('owner', 'admin', 'dispatcher')
  );

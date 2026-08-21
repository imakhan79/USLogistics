-- Extra demo data for Dispatch/Load Details/Exceptions/Documents/Finance pages.
-- Safe to re-run: clears and re-seeds documents/invoices/communications/history
-- for the demo tenant only.

do $$
declare
  t_id uuid;
  l record;
  i int := 0;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';

  delete from public.documents where tenant_id = t_id;
  delete from public.invoices where tenant_id = t_id;
  delete from public.communications where tenant_id = t_id;
  delete from public.load_status_history where tenant_id = t_id;

  for l in select * from public.loads where tenant_id = t_id order by load_number loop
    i := i + 1;

    insert into public.documents (tenant_id, load_id, name, doc_type, status, expires_at, created_at)
    values (
      t_id, l.id, l.load_number || ' - Rate Confirmation.pdf', 'rate_confirmation',
      case when i % 4 = 0 then 'pending' else 'validated' end,
      null, l.created_at + interval '1 hour'
    );

    if l.status in ('in_transit', 'delivered') then
      insert into public.documents (tenant_id, load_id, name, doc_type, status, created_at)
      values (t_id, l.id, l.load_number || ' - BOL.pdf', 'bol', 'active', l.created_at + interval '2 hour');
    end if;

    if l.status = 'delivered' then
      insert into public.documents (tenant_id, load_id, name, doc_type, status, created_at)
      values (t_id, l.id, l.load_number || ' - POD.pdf', 'pod', 'validated', l.created_at + interval '3 day');
    end if;

    if l.carrier_id is not null and i % 5 = 0 then
      insert into public.documents (tenant_id, carrier_id, name, doc_type, status, expires_at, created_at)
      values (t_id, l.carrier_id, 'Certificate of Insurance.pdf', 'insurance_certificate', 'expired', current_date - 5, l.created_at);
    end if;

    insert into public.communications (tenant_id, load_id, type, subject, body, occurred_at)
    values (t_id, l.id, 'note', 'Load created', 'Load booked with ' || coalesce(l.origin_summary,'origin') || ' -> ' || coalesce(l.destination_summary,'destination'), l.created_at);

    if l.status in ('in_transit', 'delivered') then
      insert into public.communications (tenant_id, load_id, type, subject, body, occurred_at)
      values (t_id, l.id, 'call', 'Pickup confirmed', 'Driver confirmed on-time pickup by phone.', l.pickup_date);
    end if;

    insert into public.load_status_history (tenant_id, load_id, from_status, to_status, changed_at)
    values (t_id, l.id, null, 'booked', l.created_at);

    if l.status <> 'booked' then
      insert into public.load_status_history (tenant_id, load_id, from_status, to_status, changed_at)
      values (t_id, l.id, 'booked', l.status, l.created_at + interval '4 hour');
    end if;

    if l.status = 'delivered' then
      insert into public.invoices (tenant_id, customer_id, load_id, invoice_number, amount, status, due_date, issued_at)
      values (
        t_id, l.customer_id, l.id, 'INV-' || (2000 + i), l.revenue,
        (array['sent','paid','overdue'])[1 + (i % 3)],
        (l.created_at + interval '30 day')::date,
        (l.created_at + interval '1 day')::date
      );
    end if;
  end loop;
end $$;

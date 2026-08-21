do $$
declare
  t_id uuid;
  cust_a uuid; cust_b uuid; cust_c uuid;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';
  select id into cust_a from public.customers where tenant_id = t_id and name = 'Meridian Retail Group';
  select id into cust_b from public.customers where tenant_id = t_id and name = 'Cascade Foods Inc.';
  select id into cust_c from public.customers where tenant_id = t_id and name = 'Ironclad Industrial Supply';

  delete from public.opportunities where tenant_id = t_id;

  insert into public.opportunities (tenant_id, customer_id, name, stage, estimated_value, probability_pct, expected_close_date, notes) values
    (t_id, null, 'Northwind Distribution — new lane inquiry', 'lead', 45000, 15, current_date + 21, 'Inbound call, wants weekly reefer lanes PNW to Southeast.'),
    (t_id, cust_c, 'Ironclad — Q4 flatbed volume increase', 'qualified', 68000, 35, current_date + 14, 'Existing customer expanding into steel coil shipments.'),
    (t_id, cust_a, 'Meridian Retail — peak season dry van contract', 'quoting', 120000, 55, current_date + 10, 'Quote Q-1001 sent for Chicago-Atlanta lane, awaiting response.'),
    (t_id, cust_b, 'Cascade Foods — dedicated reefer capacity', 'negotiation', 95000, 70, current_date + 7, 'Negotiating rate on 3x/week Seattle-Denver reefer commitment.'),
    (t_id, cust_b, 'Cascade Foods — onboarding contract', 'won', 42000, 100, current_date - 30, 'Signed initial contract, now an active customer.'),
    (t_id, null, 'Regional Grocers Co-op — spot quote', 'lost', 18000, 0, current_date - 5, 'Went with a lower-cost carrier; revisit next quarter.')
  ;
end $$;

-- Demo tenant + realistic seed data for the Command Center Dashboard.
-- Safe to re-run: wipes and recreates the demo tenant's rows only.

do $$
declare
  t_id uuid;
  cust_a uuid; cust_b uuid; cust_c uuid;
  carr_a uuid; carr_b uuid; carr_c uuid;
  drv_a uuid; drv_b uuid; drv_c uuid; drv_d uuid;
  trk_a uuid; trk_b uuid; trk_c uuid; trk_d uuid; trk_e uuid;
  ld record;
  ld_id uuid;
  i int;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';
  if t_id is not null then
    delete from public.tenants where id = t_id;
  end if;

  insert into public.tenants (name, slug) values ('Demo Freight Co', 'demo-freight-co')
  returning id into t_id;

  insert into public.customers (tenant_id, name, contact_name, contact_email, contact_phone, billing_address)
  values
    (t_id, 'Meridian Retail Group', 'Alicia Fenn', 'alicia.fenn@meridianretail.com', '312-555-0142', '4400 W Fulton St, Chicago, IL'),
    (t_id, 'Cascade Foods Inc.', 'Marcus Yee', 'marcus.yee@cascadefoods.com', '206-555-0188', '900 Alaskan Way, Seattle, WA'),
    (t_id, 'Ironclad Industrial Supply', 'Renee Cordova', 'renee.cordova@ironcladsupply.com', '713-555-0166', '2200 Buffalo Speedway, Houston, TX');

  select id into cust_a from public.customers where tenant_id = t_id and name = 'Meridian Retail Group';
  select id into cust_b from public.customers where tenant_id = t_id and name = 'Cascade Foods Inc.';
  select id into cust_c from public.customers where tenant_id = t_id and name = 'Ironclad Industrial Supply';

  insert into public.carriers (tenant_id, name, mc_number, dot_number, contact_name, contact_email, contact_phone, safety_rating, insurance_expiry, status)
  values
    (t_id, 'Redline Transport LLC', 'MC-482910', 'DOT-1928374', 'Tom Baxter', 'dispatch@redlinetransport.com', '469-555-0110', 'Satisfactory', current_date + interval '90 days', 'active'),
    (t_id, 'Summit Carriers Inc.', 'MC-559213', 'DOT-2837465', 'Priya Nair', 'ops@summitcarriers.com', '404-555-0134', 'Satisfactory', current_date + interval '45 days', 'active'),
    (t_id, 'Blue Horizon Freight', 'MC-330871', 'DOT-3746192', 'Dan Wexler', 'dispatch@bluehorizonfreight.com', '602-555-0177', 'Conditional', current_date + interval '10 days', 'flagged');

  select id into carr_a from public.carriers where tenant_id = t_id and name = 'Redline Transport LLC';
  select id into carr_b from public.carriers where tenant_id = t_id and name = 'Summit Carriers Inc.';
  select id into carr_c from public.carriers where tenant_id = t_id and name = 'Blue Horizon Freight';

  insert into public.drivers (tenant_id, carrier_id, name, phone, email, license_number, license_expiry, status)
  values
    (t_id, carr_a, 'Jerome Walsh', '469-555-0201', 'jerome.walsh@redlinetransport.com', 'TX-DL-88213', current_date + interval '400 days', 'active'),
    (t_id, carr_b, 'Maria Gonzalez', '404-555-0223', 'maria.gonzalez@summitcarriers.com', 'GA-DL-77102', current_date + interval '250 days', 'active'),
    (t_id, carr_c, 'Kevin O''Neal', '602-555-0245', 'kevin.oneal@bluehorizonfreight.com', 'AZ-DL-55891', current_date + interval '60 days', 'active'),
    (t_id, null, 'Sam Ellison', '312-555-0267', 'sam.ellison@demofreight.com', 'IL-DL-44120', current_date + interval '500 days', 'off_duty');

  select id into drv_a from public.drivers where tenant_id = t_id and name = 'Jerome Walsh';
  select id into drv_b from public.drivers where tenant_id = t_id and name = 'Maria Gonzalez';
  select id into drv_c from public.drivers where tenant_id = t_id and name = 'Kevin O''Neal';
  select id into drv_d from public.drivers where tenant_id = t_id and name = 'Sam Ellison';

  insert into public.trucks (tenant_id, unit_number, equipment_type, make, model, year, plate, status, current_driver_id)
  values
    (t_id, 'TRK-101', 'truck', 'Freightliner', 'Cascadia', 2023, 'TX-8821AB', 'in_transit', drv_a),
    (t_id, 'TRK-102', 'truck', 'Kenworth', 'T680', 2022, 'GA-4471CD', 'in_transit', drv_b),
    (t_id, 'TRK-103', 'truck', 'Peterbilt', '579', 2021, 'AZ-9012EF', 'maintenance', drv_c),
    (t_id, 'TRK-104', 'truck', 'Volvo', 'VNL', 2023, 'IL-3345GH', 'available', drv_d),
    (t_id, 'TRK-105', 'truck', 'Freightliner', 'Cascadia', 2024, 'IL-7789IJ', 'available', null);

  select id into trk_a from public.trucks where tenant_id = t_id and unit_number = 'TRK-101';
  select id into trk_b from public.trucks where tenant_id = t_id and unit_number = 'TRK-102';
  select id into trk_c from public.trucks where tenant_id = t_id and unit_number = 'TRK-103';
  select id into trk_d from public.trucks where tenant_id = t_id and unit_number = 'TRK-104';
  select id into trk_e from public.trucks where tenant_id = t_id and unit_number = 'TRK-105';

  -- Loads across every dispatch status, spread over the last 14 days for the revenue/margin trend chart.
  for i in 1..20 loop
    insert into public.loads (
      tenant_id, load_number, customer_id, carrier_id, driver_id, truck_id, status,
      equipment_type, commodity, weight_lbs, pallets, origin_summary, destination_summary,
      revenue, carrier_cost, risk_score, risk_level, pickup_date, delivery_date, created_at
    ) values (
      t_id,
      'LD-' || (1000 + i),
      (array[cust_a, cust_b, cust_c])[1 + (i % 3)],
      case when i % 5 = 0 then null else (array[carr_a, carr_b, carr_c])[1 + (i % 3)] end,
      case when i % 5 = 0 then null else (array[drv_a, drv_b, drv_c])[1 + (i % 3)] end,
      case when i % 5 = 0 then null else (array[trk_a, trk_b, trk_c, trk_d])[1 + (i % 4)] end,
      (array['booked','covered','pickup','in_transit','delivered'])[1 + (i % 5)],
      (array['Dry Van','Reefer','Flatbed'])[1 + (i % 3)],
      (array['Consumer Electronics','Frozen Foods','Steel Coils','Packaged Goods'])[1 + (i % 4)],
      18000 + (i * 350),
      10 + (i % 15),
      (array['Chicago, IL','Seattle, WA','Houston, TX'])[1 + (i % 3)],
      (array['Atlanta, GA','Dallas, TX','Denver, CO','Phoenix, AZ'])[1 + (i % 4)],
      2200 + (i * 137.5),
      case when i % 7 = 0 then 2200 + (i * 137.5) * 0.94 else 1600 + (i * 95) end,
      case when i % 7 = 0 then 88 when i % 4 = 0 then 62 else 15 + (i % 10) end,
      case when i % 7 = 0 then 'critical' when i % 4 = 0 then 'warning' else 'ok' end,
      now() - ((14 - (i % 14)) || ' days')::interval,
      now() - ((14 - (i % 14)) || ' days')::interval + interval '2 days',
      now() - ((14 - (i % 14)) || ' days')::interval
    );
  end loop;

  -- Stops (pickup + delivery) for every load, with rough US city coordinates for the map.
  insert into public.load_stops (tenant_id, load_id, stop_type, sequence, city, state, lat, lng, scheduled_at, status)
  select
    t_id, l.id, 'pickup', 1,
    split_part(l.origin_summary, ',', 1), trim(split_part(l.origin_summary, ',', 2)),
    case split_part(l.origin_summary, ',', 1)
      when 'Chicago' then 41.8781 when 'Seattle' then 47.6062 when 'Houston' then 29.7604 else 39.8283 end,
    case split_part(l.origin_summary, ',', 1)
      when 'Chicago' then -87.6298 when 'Seattle' then -122.3321 when 'Houston' then -95.3698 else -98.5795 end,
    l.pickup_date, case when l.status in ('in_transit','delivered') then 'completed' else 'pending' end
  from public.loads l where l.tenant_id = t_id;

  insert into public.load_stops (tenant_id, load_id, stop_type, sequence, city, state, lat, lng, scheduled_at, status)
  select
    t_id, l.id, 'delivery', 2,
    split_part(l.destination_summary, ',', 1), trim(split_part(l.destination_summary, ',', 2)),
    case split_part(l.destination_summary, ',', 1)
      when 'Atlanta' then 33.7490 when 'Dallas' then 32.7767 when 'Denver' then 39.7392 when 'Phoenix' then 33.4484 else 39.8283 end,
    case split_part(l.destination_summary, ',', 1)
      when 'Atlanta' then -84.3880 when 'Dallas' then -96.7970 when 'Denver' then -104.9903 when 'Phoenix' then -112.0740 else -98.5795 end,
    l.delivery_date, case when l.status = 'delivered' then 'completed' else 'pending' end
  from public.loads l where l.tenant_id = t_id;

  -- Exceptions for the highest-risk loads.
  insert into public.exceptions (tenant_id, load_id, severity, category, issue_summary, sla_deadline, status, detected_at)
  select
    t_id, l.id,
    case when l.risk_level = 'critical' then 'critical' else 'warning' end,
    (array['carrier_cancellation','late_pickup','low_margin','missing_documents'])[1 + (row_number() over (order by l.created_at) % 4)],
    case (row_number() over (order by l.created_at) % 4)
      when 0 then 'Carrier ' || coalesce((select name from public.carriers c where c.id = l.carrier_id), 'unassigned') || ' cancelled with short notice'
      when 1 then 'Pickup at risk of running late for ' || l.load_number
      when 2 then 'Margin has fallen below target threshold on ' || l.load_number
      else 'Missing rate confirmation / BOL for ' || l.load_number
    end,
    now() + interval '6 hours',
    'open',
    l.created_at + interval '1 hour'
  from public.loads l
  where l.tenant_id = t_id and l.risk_level in ('warning', 'critical');
end $$;

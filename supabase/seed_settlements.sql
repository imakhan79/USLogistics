do $$
declare
  t_id uuid;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';

  -- Rough real driving miles for the lanes used in seed data.
  update public.loads set miles = case
    when origin_summary = 'Chicago, IL' and destination_summary = 'Atlanta, GA' then 715
    when origin_summary = 'Chicago, IL' and destination_summary = 'Dallas, TX' then 925
    when origin_summary = 'Chicago, IL' and destination_summary = 'Denver, CO' then 1000
    when origin_summary = 'Chicago, IL' and destination_summary = 'Phoenix, AZ' then 1450
    when origin_summary = 'Seattle, WA' and destination_summary = 'Atlanta, GA' then 2620
    when origin_summary = 'Seattle, WA' and destination_summary = 'Dallas, TX' then 2100
    when origin_summary = 'Seattle, WA' and destination_summary = 'Denver, CO' then 1320
    when origin_summary = 'Seattle, WA' and destination_summary = 'Phoenix, AZ' then 1470
    when origin_summary = 'Houston, TX' and destination_summary = 'Atlanta, GA' then 790
    when origin_summary = 'Houston, TX' and destination_summary = 'Dallas, TX' then 240
    when origin_summary = 'Houston, TX' and destination_summary = 'Denver, CO' then 1020
    when origin_summary = 'Houston, TX' and destination_summary = 'Phoenix, AZ' then 1180
    else 800
  end
  where tenant_id = t_id and miles is null;

  -- Vary pay type/rate across the seeded drivers for a realistic demo.
  update public.drivers set pay_type = 'per_mile', pay_rate = 0.58 where tenant_id = t_id and name = 'Jerome Walsh';
  update public.drivers set pay_type = 'percentage', pay_rate = 0.68 where tenant_id = t_id and name = 'Maria Gonzalez';
  update public.drivers set pay_type = 'per_mile', pay_rate = 0.55 where tenant_id = t_id and name = 'Kevin O''Neal';
  update public.drivers set pay_type = 'fixed', pay_rate = 850 where tenant_id = t_id and name = 'Sam Ellison';
end $$;

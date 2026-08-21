do $$
declare
  t_id uuid;
begin
  select id into t_id from public.tenants where slug = 'demo-freight-co';
  delete from public.ai_agents where tenant_id = t_id;

  insert into public.ai_agents (tenant_id, key, name, description, autonomy_level, enabled) values
    (t_id, 'dispatch', 'Dispatch Agent', 'Matches loads to available carriers/assets and ranks coverage options.', 2, true),
    (t_id, 'carrier', 'Carrier Agent', 'Monitors carrier qualification, insurance expiry, and performance.', 2, true),
    (t_id, 'tracking', 'Tracking Agent', 'Watches ETA risk and geofence events for active loads.', 1, true),
    (t_id, 'recovery', 'Recovery Agent', 'Generates recovery options when a load hits an exception.', 2, true),
    (t_id, 'document', 'Document Agent', 'Classifies uploads and flags missing or expiring documents.', 1, true),
    (t_id, 'compliance', 'Compliance Agent', 'Checks carrier and driver documents against qualification rules.', 1, true),
    (t_id, 'finance', 'Finance Agent', 'Tracks AR/AP aging and drafts invoices on delivery.', 1, true),
    (t_id, 'customer', 'Customer Agent', 'Surfaces at-risk accounts and lane profitability shifts.', 1, false),
    (t_id, 'sales', 'Sales Agent', 'Recommends rates for new quotes based on lane history.', 0, false),
    (t_id, 'collections', 'Collections Agent', 'Flags overdue invoices for follow-up.', 1, false),
    (t_id, 'profit', 'Profit Guardian', 'Continuously monitors margin decline and cost spikes.', 2, true);
end $$;

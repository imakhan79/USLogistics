import { createClient } from "@/lib/supabase/server";
import { FinanceCenter } from "@/components/finance/finance-center";
import type { RevenueMarginPoint } from "@/components/dashboard/revenue-margin-chart";

export default async function FinancePage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: loads }] = await Promise.all([
    supabase.from("invoices").select("*, customer:customers(name)").order("issued_at", { ascending: false }),
    supabase.from("loads").select("*"),
  ]);

  const allLoads = loads ?? [];
  const byDay = new Map<string, { revenue: number; margin: number }>();
  for (const l of allLoads) {
    const day = new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = byDay.get(day) ?? { revenue: 0, margin: 0 };
    entry.revenue += Number(l.revenue);
    entry.margin += Number(l.margin);
    byDay.set(day, entry);
  }
  const chartData: RevenueMarginPoint[] = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(-14);

  return (
    <FinanceCenter
      invoices={(invoices ?? []) as never}
      loads={allLoads as never}
      chartData={chartData}
    />
  );
}

"use client";

import { useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueMarginChart, type RevenueMarginPoint } from "@/components/dashboard/revenue-margin-chart";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { markInvoicePaid } from "@/app/(app)/finance/actions";
import { Download } from "lucide-react";
import type { Invoice, Load } from "@/lib/types/database";

type EnrichedInvoice = Invoice & { customer: { name: string } | null };

function agingBucket(dueDate: string | null) {
  if (!dueDate) return "current";
  const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86_400_000);
  if (days <= 0) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  return "60+";
}

export function FinanceCenter({
  invoices,
  loads,
  chartData,
}: {
  invoices: EnrichedInvoice[];
  loads: Load[];
  chartData: RevenueMarginPoint[];
}) {
  const [isPending, startTransition] = useTransition();

  const totalRevenue = loads.reduce((sum, l) => sum + Number(l.revenue), 0);
  const totalMargin = loads.reduce((sum, l) => sum + Number(l.margin), 0);
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const openInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "draft");
  const arTotal = openInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  const deliveredNoInvoice = loads.filter((l) => l.status === "delivered");
  const apTotal = deliveredNoInvoice.reduce((sum, l) => sum + Number(l.carrier_cost), 0);

  const cashFlowForecast = arTotal - apTotal;

  const aging = useMemo(() => {
    const buckets: Record<string, number> = { current: 0, "1-30": 0, "31-60": 0, "60+": 0 };
    for (const inv of openInvoices) buckets[agingBucket(inv.due_date)] += Number(inv.amount);
    return buckets;
  }, [openInvoices]);
  const maxAging = Math.max(1, ...Object.values(aging));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance Center</h1>
          <p className="text-sm text-muted-foreground">AR, AP, factoring, and reporting</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Revenue" value={formatCurrency(totalRevenue)} changePct={18} changeDirection="up" />
        <KpiCard label="AR Aging (open)" value={formatCurrency(arTotal)} changePct={6} changeDirection="down" goodDirection="down" />
        <KpiCard label="AP (carrier cost)" value={formatCurrency(apTotal)} changePct={4} changeDirection="down" goodDirection="down" />
        <KpiCard label="Cash Flow Forecast" value={formatCurrency(cashFlowForecast)} changePct={9} changeDirection="up" />
        <KpiCard label="Profit Margin" value={formatPercent(marginPct)} changePct={2.3} changeDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueMarginChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>AR Aging Distribution</CardTitle>
            <CardDescription>Open invoices by days past due</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(aging).map(([bucket, amount]) => (
              <div key={bucket}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{bucket === "current" ? "Current" : `${bucket} days`}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-accent-teal"
                    style={{ width: `${(amount / maxAging) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <Tabs
            tabs={[
              { value: "ar", label: "AR" },
              { value: "ap", label: "AP" },
              { value: "factoring", label: "Factoring" },
              { value: "reports", label: "Reports" },
              { value: "export", label: "Export" },
            ]}
          >
            {(active) => (
              <>
                {active === "ar" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-2 py-3 font-medium">Invoice</th>
                          <th className="px-2 py-3 font-medium">Customer</th>
                          <th className="px-2 py-3 font-medium">Amount</th>
                          <th className="px-2 py-3 font-medium">Due</th>
                          <th className="px-2 py-3 font-medium">Status</th>
                          <th className="px-2 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-border last:border-0">
                            <td className="px-2 py-3 font-medium">{inv.invoice_number}</td>
                            <td className="px-2 py-3 text-muted-foreground">{inv.customer?.name ?? "—"}</td>
                            <td className="px-2 py-3">{formatCurrency(Number(inv.amount))}</td>
                            <td className="px-2 py-3 text-muted-foreground">{inv.due_date}</td>
                            <td className="px-2 py-3">
                              <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : "neutral"}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="outline">View</Button>
                                {inv.status !== "paid" && (
                                  <Button
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() => startTransition(() => markInvoicePaid(inv.id))}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr><td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">No invoices yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {active === "ap" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-2 py-3 font-medium">Load</th>
                          <th className="px-2 py-3 font-medium">Carrier Cost</th>
                          <th className="px-2 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveredNoInvoice.map((l) => (
                          <tr key={l.id} className="border-b border-border last:border-0">
                            <td className="px-2 py-3 font-medium">{l.load_number}</td>
                            <td className="px-2 py-3">{formatCurrency(Number(l.carrier_cost))}</td>
                            <td className="px-2 py-3"><Badge variant="warning">Pending payout</Badge></td>
                          </tr>
                        ))}
                        {deliveredNoInvoice.length === 0 && (
                          <tr><td colSpan={3} className="px-2 py-8 text-center text-muted-foreground">No carrier payables yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {active === "factoring" && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Factoring partner integration — coming in a future pass.
                  </p>
                )}
                {active === "reports" && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Custom financial reports — coming in a future pass.
                  </p>
                )}
                {active === "export" && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <p className="text-sm text-muted-foreground">Export the current invoice list as CSV.</p>
                    <Button variant="outline"><Download className="h-3.5 w-3.5" /> Export CSV</Button>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AddNoteForm } from "@/components/customers/add-note-form";
import type { Load } from "@/lib/types/database";

const STAGE_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  lead: "neutral",
  qualified: "accent",
  quoting: "accent",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: loads }, { data: invoices }, { data: opportunities }, { data: notes }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("loads").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("customer_id", id),
      supabase.from("opportunities").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase.from("communications").select("*").eq("customer_id", id).order("occurred_at", { ascending: false }),
    ]);

  if (!customer) notFound();

  const allLoads = (loads ?? []) as Load[];
  const totalRevenue = allLoads.reduce((sum, l) => sum + Number(l.revenue), 0);
  const totalMargin = allLoads.reduce((sum, l) => sum + Number(l.margin), 0);
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const allInvoices = invoices ?? [];
  const paidInvoices = allInvoices.filter((i) => i.status === "paid");
  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue");
  const paymentBehavior =
    allInvoices.length === 0 ? "No history" : overdueInvoices.length === 0 ? "On time" : `${overdueInvoices.length} overdue`;

  const laneCounts = new Map<string, number>();
  for (const l of allLoads) {
    const lane = `${l.origin_summary} → ${l.destination_summary}`;
    laneCounts.set(lane, (laneCounts.get(lane) ?? 0) + 1);
  }
  const topLanes = Array.from(laneCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/customers" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <Badge variant={customer.status === "active" ? "success" : "neutral"}>{customer.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {customer.contact_name} {customer.contact_email ? `· ${customer.contact_email}` : ""} {customer.contact_phone ? `· ${customer.contact_phone}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} changePct={0} changeDirection="up" />
        <KpiCard label="Total Profit" value={`$${totalMargin.toLocaleString()}`} changePct={0} changeDirection="up" />
        <KpiCard label="Margin" value={`${marginPct.toFixed(1)}%`} changePct={0} changeDirection="up" />
        <KpiCard label="Load Volume" value={String(allLoads.length)} changePct={0} changeDirection="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Behavior</CardTitle>
            <CardDescription>{allInvoices.length} invoices on file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{paymentBehavior}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">{paidInvoices.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className="font-medium">{overdueInvoices.length}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Lanes</CardTitle>
            <CardDescription>Most frequent origin → destination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {topLanes.length === 0 && <p className="text-muted-foreground">No load history yet.</p>}
            {topLanes.map(([lane, count]) => (
              <div key={lane} className="flex justify-between">
                <span className="truncate">{lane}</span>
                <span className="text-muted-foreground">{count}x</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(opportunities ?? []).length === 0 && <p className="text-sm text-muted-foreground">No opportunities for this customer.</p>}
          {(opportunities ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{o.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">${Number(o.estimated_value).toLocaleString()}</span>
                <Badge variant={STAGE_VARIANT[o.stage]}>{o.stage}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AddNoteForm customerId={customer.id} />
          {(notes ?? []).length === 0 && <p className="text-sm text-muted-foreground">No activity logged yet.</p>}
          {(notes ?? []).map((n) => (
            <div key={n.id} className="rounded-lg border border-border p-3 text-sm">
              <p>{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.occurred_at).toLocaleString("en-US")}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

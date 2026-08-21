import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadTabs } from "@/components/loads/load-tabs";
import { LoadHeaderActions } from "@/components/loads/load-header-actions";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  covered: "Covered",
  pickup: "Pickup",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function LoadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: load }, { data: stops }, { data: documents }, { data: communications }, { data: history }, { data: invoice }] =
    await Promise.all([
      supabase
        .from("loads")
        .select("*, customer:customers(name), carrier:carriers(name, contact_phone), driver:drivers(name, phone), truck:trucks(unit_number)")
        .eq("id", id)
        .single(),
      supabase.from("load_stops").select("*").eq("load_id", id).order("sequence"),
      supabase.from("documents").select("*").eq("load_id", id).order("created_at"),
      supabase.from("communications").select("*").eq("load_id", id).order("occurred_at"),
      supabase.from("load_status_history").select("*").eq("load_id", id).order("changed_at"),
      supabase.from("invoices").select("*").eq("load_id", id).maybeSingle(),
    ]);

  if (!load) notFound();

  const margin = Number(load.revenue) - Number(load.carrier_cost);
  const marginPct = Number(load.revenue) > 0 ? (margin / Number(load.revenue)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/loads" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Loads
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{load.load_number}</h1>
            <Badge variant={load.risk_level === "critical" ? "danger" : load.risk_level === "warning" ? "warning" : "success"}>
              {STATUS_LABEL[load.status] ?? load.status}
            </Badge>
          </div>
        </div>
        <LoadHeaderActions loadId={load.id} status={load.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Load Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Customer" value={load.customer?.name ?? "—"} />
            <Field label="Equipment" value={load.equipment_type ?? "—"} />
            <Field label="Commodity" value={load.commodity ?? "—"} />
            <Field label="Weight" value={load.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : "—"} />
            <Field label="Pallets" value={load.pallets ?? "—"} />
            <Field label="Carrier" value={load.carrier?.name ?? "Unassigned"} />
            <Field label="Driver" value={load.driver?.name ?? "—"} />
            <Field label="Truck" value={load.truck?.unit_number ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Revenue" value={`$${Number(load.revenue).toLocaleString()}`} />
            <Field label="Carrier Cost" value={`$${Number(load.carrier_cost).toLocaleString()}`} />
            <Field label="Gross Profit" value={`$${margin.toLocaleString()}`} />
            <Field label="Margin" value={`${marginPct.toFixed(1)}%`} />
            <Field label="Risk Score" value={String(load.risk_score)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stops</CardTitle>
          <CardDescription>Pickup and delivery timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {(stops ?? []).map((stop, idx) => (
              <li key={stop.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      stop.stop_type === "pickup" ? "bg-electric-blue" : "bg-accent-teal"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {idx < (stops?.length ?? 0) - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">
                    {stop.stop_type === "pickup" ? "Pickup" : "Delivery"} — {stop.city}, {stop.state}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stop.scheduled_at ? new Date(stop.scheduled_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unscheduled"}
                    {" · "}
                    {stop.status}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <LoadTabs
        documents={documents ?? []}
        communications={communications ?? []}
        history={history ?? []}
        invoice={invoice ?? null}
        load={load}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

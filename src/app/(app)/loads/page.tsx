import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  covered: "Covered",
  pickup: "Pickup",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function LoadsPage() {
  const supabase = await createClient();
  const { data: loads } = await supabase
    .from("loads")
    .select("*, customer:customers(name), carrier:carriers(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loads</h1>
        <p className="text-sm text-muted-foreground">{loads?.length ?? 0} loads on file</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Load</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(loads ?? []).map((load) => (
                <tr key={load.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/loads/${load.id}`} className="hover:text-accent-teal">
                      {load.load_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{load.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {load.origin_summary} → {load.destination_summary}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{load.carrier?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{STATUS_LABEL[load.status] ?? load.status}</Badge>
                  </td>
                  <td className="px-4 py-3">${Number(load.revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

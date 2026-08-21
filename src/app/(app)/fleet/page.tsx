import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  available: "success",
  in_transit: "neutral",
  maintenance: "warning",
  out_of_service: "danger",
};

export default async function FleetPage() {
  const supabase = await createClient();
  const { data: trucks } = await supabase
    .from("trucks")
    .select("*, current_driver:drivers(name)")
    .order("unit_number");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fleet</h1>
        <p className="text-sm text-muted-foreground">{trucks?.length ?? 0} trucks & trailers</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Make / Model</th>
                <th className="px-4 py-3 font-medium">Plate</th>
                <th className="px-4 py-3 font-medium">Current Driver</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(trucks ?? []).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">{t.unit_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.make} {t.model} {t.year ? `(${t.year})` : ""}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.plate ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.current_driver?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[t.status] ?? "neutral"}>{t.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

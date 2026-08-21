import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  flagged: "danger",
};

export default async function CarriersPage() {
  const supabase = await createClient();
  const { data: carriers } = await supabase.from("carriers").select("*").order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Carriers</h1>
        <p className="text-sm text-muted-foreground">{carriers?.length ?? 0} carriers qualified</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">MC / DOT</th>
                <th className="px-4 py-3 font-medium">Safety Rating</th>
                <th className="px-4 py-3 font-medium">Insurance Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(carriers ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.mc_number} · {c.dot_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.safety_rating ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.insurance_expiry ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[c.status] ?? "neutral"}>{c.status}</Badge>
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

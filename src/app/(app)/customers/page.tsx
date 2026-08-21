import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*, loads:loads(revenue)")
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">{customers?.length ?? 0} accounts on file</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Total Revenue</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c) => {
                const revenue = (c.loads ?? []).reduce((sum: number, l: { revenue: number }) => sum + Number(l.revenue), 0);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.contact_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.contact_phone ?? "—"}</td>
                    <td className="px-4 py-3">${revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

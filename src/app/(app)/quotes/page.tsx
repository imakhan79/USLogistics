import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  draft: "neutral",
  quoted: "accent",
  sent: "warning",
  approved: "success",
  rejected: "danger",
  converted: "success",
  expired: "neutral",
};

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quoting & Rate Intelligence</h1>
          <p className="text-sm text-muted-foreground">{quotes?.length ?? 0} quotes</p>
        </div>
        <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" /> New Quote
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Quote</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Margin</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(quotes ?? []).map((q) => (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/quotes/${q.id}`} className="hover:text-accent-teal">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{q.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {q.origin_summary} → {q.destination_summary}
                  </td>
                  <td className="px-4 py-3">{q.recommended_rate != null ? `$${Number(q.recommended_rate).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">${Number(q.expected_margin).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.risk_score}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[q.status] ?? "neutral"}>{q.status}</Badge>
                  </td>
                </tr>
              ))}
              {(quotes ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No quotes yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

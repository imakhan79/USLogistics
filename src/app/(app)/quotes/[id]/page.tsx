import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";
import { QuoteActions } from "@/components/quotes/quote-actions";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  draft: "neutral",
  quoted: "accent",
  sent: "warning",
  approved: "success",
  rejected: "danger",
  converted: "success",
  expired: "neutral",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, customer:customers(name, contact_email)")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/quotes" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Quotes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{quote.quote_number}</h1>
            <Badge variant={STATUS_VARIANT[quote.status] ?? "neutral"}>{quote.status}</Badge>
          </div>
          <QuoteActions quoteId={quote.id} status={quote.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lane & Load</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Customer" value={quote.customer?.name ?? "—"} />
          <Field label="Equipment" value={quote.equipment_type} />
          <Field label="Route" value={`${quote.origin_summary} → ${quote.destination_summary}`} />
          <Field label="Commodity" value={quote.commodity ?? "—"} />
          <Field label="Miles" value={`${quote.miles} loaded + ${quote.deadhead_miles} deadhead`} />
          <Field label="Weight" value={quote.weight_lbs ? `${Number(quote.weight_lbs).toLocaleString()} lbs` : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate & Cost</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Field label="Recommended Rate" value={`$${Number(quote.recommended_rate ?? 0).toLocaleString()}`} />
          <Field label="Minimum Rate" value={`$${Number(quote.minimum_rate ?? 0).toLocaleString()}`} />
          <Field label="Total Cost" value={`$${Number(quote.total_cost_estimate).toLocaleString()}`} />
          <Field label="Expected Margin" value={`$${Number(quote.expected_margin).toLocaleString()}`} />
          <Field label="Carrier Cost" value={`$${Number(quote.carrier_cost_estimate).toLocaleString()}`} />
          <Field label="Fuel Cost" value={`$${Number(quote.fuel_cost_estimate).toLocaleString()}`} />
          <Field label="Deadhead Cost" value={`$${Number(quote.deadhead_cost_estimate).toLocaleString()}`} />
          <Field label="Risk Score" value={`${quote.risk_score}/100`} />
        </CardContent>
      </Card>

      {quote.ai_rationale && (
        <Card>
          <CardContent className="pt-5">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-teal">
              <Sparkles className="h-3.5 w-3.5" /> AI Rationale
            </div>
            <p className="text-sm">{quote.ai_rationale}</p>
          </CardContent>
        </Card>
      )}

      {quote.converted_load_id && (
        <Card>
          <CardContent className="flex items-center justify-between pt-5 text-sm">
            <span>Converted to load</span>
            <Link href={`/loads/${quote.converted_load_id}`} className="font-medium text-accent-teal hover:underline">
              View load →
            </Link>
          </CardContent>
        </Card>
      )}
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

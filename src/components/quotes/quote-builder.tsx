"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MapPinned } from "lucide-react";
import { getRateRecommendation, createQuote } from "@/app/(app)/quotes/actions";
import type { QuoteEstimate } from "@/lib/quoting/rate-engine";

const EQUIPMENT_TYPES = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only"];
const STEPS = ["Quote Request", "Analyze Lane", "Calculate Cost", "Recommend Rate", "Create Quote"];

export function QuoteBuilder({ customers }: { customers: { id: string; name: string }[] }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("Dry Van");
  const [commodity, setCommodity] = useState("");
  const [weight, setWeight] = useState("");
  const [miles, setMiles] = useState("");
  const [deadhead, setDeadhead] = useState("0");
  const [accessorial, setAccessorial] = useState("0");
  const [targetMargin, setTargetMargin] = useState("20");

  const [result, setResult] = useState<{ estimate: QuoteEstimate; rationale: string; model: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const step = result ? 4 : origin && destination && miles ? 1 : 0;

  async function calculateDistance() {
    setDistanceError(null);
    setDistanceLoading(true);
    try {
      const res = await fetch("/api/geo/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "distance lookup failed");
      setMiles(String(data.miles));
    } catch (err) {
      setDistanceError(err instanceof Error ? err.message : "Distance lookup failed");
    } finally {
      setDistanceLoading(false);
    }
  }

  async function analyze() {
    setError(null);
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await getRateRecommendation({
        originSummary: origin,
        destinationSummary: destination,
        equipmentType: equipment,
        miles: Number(miles) || 0,
        deadheadMiles: Number(deadhead) || 0,
        accessorialCost: Number(accessorial) || 0,
        otherCost: 0,
        targetMarginPct: Number(targetMargin) || 20,
      });
      setResult(res);
    } catch {
      setError("Rate calculation failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function save() {
    if (!result) return;
    startSaving(async () => {
      const res = await createQuote({
        customerId: customerId || null,
        originSummary: origin,
        destinationSummary: destination,
        equipmentType: equipment,
        commodity,
        weightLbs: weight ? Number(weight) : null,
        miles: Number(miles) || 0,
        deadheadMiles: Number(deadhead) || 0,
        accessorialCost: Number(accessorial) || 0,
        otherCost: 0,
        targetMarginPct: Number(targetMargin) || 20,
        carrierCostEstimate: result.estimate.carrierCostEstimate,
        fuelCostEstimate: result.estimate.fuelCostEstimate,
        deadheadCostEstimate: result.estimate.deadheadCostEstimate,
        recommendedRate: result.estimate.recommendedRate,
        minimumRate: result.estimate.minimumRate,
        riskScore: result.estimate.riskScore,
        aiRationale: result.rationale,
        aiModel: result.model,
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
        <p className="text-sm text-muted-foreground">Analyze the lane, get an AI rate recommendation, then create the quote</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                i <= step ? "bg-accent-teal/15 text-accent-teal" : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Request</CardTitle>
          <CardDescription>Lane and load details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No customer selected</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input required placeholder="Origin (City, ST)" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            <Input required placeholder="Destination (City, ST)" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {EQUIPMENT_TYPES.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <Input placeholder="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min="0" placeholder="Weight (lbs)" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <div className="flex gap-1.5">
              <Input type="number" min="0" required placeholder="Loaded miles" value={miles} onChange={(e) => setMiles(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!origin || !destination || distanceLoading}
                onClick={calculateDistance}
                title="Calculate real driving distance via Geoapify"
              >
                {distanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {distanceError && <p className="text-xs text-danger">{distanceError}</p>}
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" min="0" placeholder="Deadhead miles" value={deadhead} onChange={(e) => setDeadhead(e.target.value)} />
            <Input type="number" min="0" placeholder="Accessorial cost ($)" value={accessorial} onChange={(e) => setAccessorial(e.target.value)} />
            <Input type="number" min="0" max="90" placeholder="Target margin %" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button className="w-full" disabled={!origin || !destination || !miles || analyzing} onClick={analyze}>
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? "Analyzing lane…" : "Get AI Rate Recommendation"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Rate</CardTitle>
            <CardDescription>
              {result.estimate.laneHistory.length > 0
                ? `Blended with ${result.estimate.laneHistory.length} historical load(s) on this lane`
                : "No prior loads on this lane — cost-plus-margin model only"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Recommended Rate" value={`$${result.estimate.recommendedRate.toLocaleString()}`} highlight />
              <Stat label="Minimum Rate" value={`$${result.estimate.minimumRate.toLocaleString()}`} />
              <Stat label="Expected Margin" value={`$${result.estimate.expectedMargin.toLocaleString()}`} />
              <Stat label="Risk Score" value={`${result.estimate.riskScore}/100`} />
            </div>

            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Cost Breakdown</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <span>Carrier: ${result.estimate.carrierCostEstimate.toLocaleString()}</span>
                <span>Fuel: ${result.estimate.fuelCostEstimate.toLocaleString()}</span>
                <span>Deadhead: ${result.estimate.deadheadCostEstimate.toLocaleString()}</span>
                <span>Accessorial: ${result.estimate.accessorialCostEstimate.toLocaleString()}</span>
              </div>
              <p className="mt-2 font-medium">Total: ${result.estimate.totalCostEstimate.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-teal">
                <Sparkles className="h-3.5 w-3.5" /> AI Rationale
              </div>
              <p className="text-sm">{result.rationale}</p>
            </div>

            {result.estimate.laneHistory.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.estimate.laneHistory.map((h) => (
                  <Badge key={h.loadNumber} variant="neutral">
                    {h.loadNumber}: ${h.revenue.toLocaleString()} ({h.marginPct.toFixed(0)}% margin)
                  </Badge>
                ))}
              </div>
            )}

            <Button className="w-full" disabled={saving} onClick={save}>
              {saving ? "Creating…" : "Create Quote"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={highlight ? "text-lg font-semibold text-accent-teal" : "text-lg font-semibold"}>{value}</p>
    </div>
  );
}

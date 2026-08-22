"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { previewSettlement, createSettlement } from "@/app/(app)/settlements/actions";

interface PreviewData {
  grossPay: number;
  loadCount: number;
  loads: { id: string; load_number: string; revenue: number; miles: number | null }[];
  payType: string;
  payRate: number;
}

const PAY_TYPE_LABEL: Record<string, string> = {
  per_mile: "per mile",
  percentage: "of revenue",
  fixed: "flat per load",
};

export function NewSettlementModal({
  drivers,
  onClose,
}: {
  drivers: { id: string; name: string; pay_type: string; pay_rate: number }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [bonus, setBonus] = useState("0");
  const [fuel, setFuel] = useState("0");
  const [tolls, setTolls] = useState("0");
  const [advances, setAdvances] = useState("0");
  const [expenses, setExpenses] = useState("0");
  const [other, setOther] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const driver = drivers.find((d) => d.id === driverId);

  async function runPreview() {
    if (!driverId || !periodStart || !periodEnd) return;
    setLoading(true);
    setError(null);
    const res = await previewSettlement(driverId, periodStart, periodEnd);
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setPreview(res as PreviewData);
  }

  const grossPay = preview?.grossPay ?? 0;
  const netPay =
    grossPay + (Number(bonus) || 0) - (Number(fuel) || 0) - (Number(tolls) || 0) - (Number(advances) || 0) - (Number(expenses) || 0) - (Number(other) || 0);

  async function submit() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    const res = await createSettlement({
      driverId,
      periodStart,
      periodEnd,
      grossPay: preview.grossPay,
      loadCount: preview.loadCount,
      bonus: Number(bonus) || 0,
      fuelDeduction: Number(fuel) || 0,
      tollsDeduction: Number(tolls) || 0,
      advancesDeduction: Number(advances) || 0,
      expensesDeduction: Number(expenses) || 0,
      otherDeductions: Number(other) || 0,
      notes,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Settlement</h2>
            <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <select
            value={driverId}
            onChange={(e) => { setDriverId(e.target.value); setPreview(null); }}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — ${d.pay_rate} {PAY_TYPE_LABEL[d.pay_type]}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={periodStart} onChange={(e) => { setPeriodStart(e.target.value); setPreview(null); }} />
            <Input type="date" value={periodEnd} onChange={(e) => { setPeriodEnd(e.target.value); setPreview(null); }} />
          </div>

          {!preview && (
            <Button className="w-full" disabled={!driverId || !periodStart || !periodEnd || loading} onClick={runPreview}>
              {loading ? "Calculating…" : "Calculate Gross Pay"}
            </Button>
          )}

          {preview && (
            <>
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{preview.loadCount} delivered loads · {driver?.name}</span>
                  <span className="font-semibold">${preview.grossPay.toLocaleString()} gross</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Bonus ($)" value={bonus} onChange={(e) => setBonus(e.target.value)} />
                <Input type="number" placeholder="Fuel ($)" value={fuel} onChange={(e) => setFuel(e.target.value)} />
                <Input type="number" placeholder="Tolls ($)" value={tolls} onChange={(e) => setTolls(e.target.value)} />
                <Input type="number" placeholder="Advances ($)" value={advances} onChange={(e) => setAdvances(e.target.value)} />
                <Input type="number" placeholder="Expenses ($)" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
                <Input type="number" placeholder="Other ($)" value={other} onChange={(e) => setOther(e.target.value)} />
              </div>
              <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <div className="flex items-center justify-between rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-3">
                <span className="text-sm font-medium">Net Pay</span>
                <span className="text-lg font-bold text-accent-teal">${netPay.toLocaleString()}</span>
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}
              <Button className="w-full" disabled={saving} onClick={submit}>
                {saving ? "Creating…" : "Create Settlement"}
              </Button>
            </>
          )}
          {error && !preview && <p className="text-xs text-danger">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

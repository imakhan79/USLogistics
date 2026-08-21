"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { updateSettlementStatus } from "@/app/(app)/settlements/actions";
import { NewSettlementModal } from "@/components/settlements/new-settlement-modal";
import type { Settlement, SettlementStatus } from "@/lib/types/database";

type EnrichedSettlement = Settlement & { driver: { name: string } | null };

const STATUS_VARIANT: Record<SettlementStatus, "neutral" | "warning" | "success"> = {
  draft: "neutral",
  approved: "warning",
  paid: "success",
};

export function SettlementsView({
  settlements,
  drivers,
}: {
  settlements: EnrichedSettlement[];
  drivers: { id: string; name: string; pay_type: string; pay_rate: number }[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalNetOwed = settlements.filter((s) => s.status !== "paid").reduce((sum, s) => sum + Number(s.net_pay), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Driver Settlements</h1>
          <p className="text-sm text-muted-foreground">
            {settlements.length} settlements · <span className="font-medium text-foreground">${totalNetOwed.toLocaleString()}</span> unpaid
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> New Settlement
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Loads</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => {
                const deductions = Number(s.fuel_deduction) + Number(s.tolls_deduction) + Number(s.advances_deduction) + Number(s.expenses_deduction) + Number(s.other_deductions);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{s.driver?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.period_start} → {s.period_end}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.load_count}</td>
                    <td className="px-4 py-3">${Number(s.gross_pay).toLocaleString()}</td>
                    <td className="px-4 py-3 text-danger">-${deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">${Number(s.net_pay).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {s.status === "draft" && (
                          <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(() => updateSettlementStatus(s.id, "approved"))}>
                            Approve
                          </Button>
                        )}
                        {s.status === "approved" && (
                          <Button size="sm" disabled={isPending} onClick={() => startTransition(() => updateSettlementStatus(s.id, "paid"))}>
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {settlements.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No settlements yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showNew && <NewSettlementModal drivers={drivers} onClose={() => setShowNew(false)} />}
    </div>
  );
}

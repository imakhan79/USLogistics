"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { updateOpportunityStage, createOpportunity } from "@/app/(app)/customers/actions";
import type { Opportunity, OpportunityStage } from "@/lib/types/database";

type EnrichedOpportunity = Opportunity & { customer: { id: string; name: string } | null };

const COLUMNS: { stage: OpportunityStage; label: string }[] = [
  { stage: "lead", label: "Lead" },
  { stage: "qualified", label: "Qualified" },
  { stage: "quoting", label: "Quoting" },
  { stage: "negotiation", label: "Negotiation" },
  { stage: "won", label: "Won" },
  { stage: "lost", label: "Lost" },
];

export function PipelineBoard({
  opportunities,
  customers,
}: {
  opportunities: EnrichedOpportunity[];
  customers: { id: string; name: string }[];
}) {
  const [dragOverCol, setDragOverCol] = useState<OpportunityStage | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPipelineValue = opportunities
    .filter((o) => o.stage !== "won" && o.stage !== "lost")
    .reduce((sum, o) => sum + Number(o.estimated_value), 0);

  function byStage(stage: OpportunityStage) {
    return opportunities.filter((o) => o.stage === stage);
  }

  function handleDrop(stage: OpportunityStage, id: string) {
    setDragOverCol(null);
    startTransition(() => updateOpportunityStage(id, stage));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">${totalPipelineValue.toLocaleString()}</span> open pipeline value
        </p>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-6">
        {COLUMNS.map((col) => (
          <div
            key={col.stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.stage);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === col.stage ? null : c))}
            onDrop={(e) => handleDrop(col.stage, e.dataTransfer.getData("oppId"))}
            className={`flex min-h-[200px] flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors ${
              dragOverCol === col.stage ? "border-accent-teal bg-accent-teal/5" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="neutral">{byStage(col.stage).length}</Badge>
            </div>
            {byStage(col.stage).map((opp) => (
              <div
                key={opp.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("oppId", opp.id)}
                className="cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
              >
                <p className="text-sm font-semibold leading-snug">{opp.name}</p>
                {opp.customer && (
                  <Link href={`/customers/${opp.customer.id}`} className="mt-1 block truncate text-xs text-accent-teal hover:underline">
                    {opp.customer.name}
                  </Link>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>${Number(opp.estimated_value).toLocaleString()}</span>
                  <span>{opp.probability_pct}%</span>
                </div>
              </div>
            ))}
            {byStage(col.stage).length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">No opportunities</p>
            )}
          </div>
        ))}
      </div>

      {showNew && <NewOpportunityModal customers={customers} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewOpportunityModal({
  customers,
  onClose,
}: {
  customers: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [value, setValue] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createOpportunity({
      customerId: customerId || null,
      name,
      estimatedValue: Number(value) || 0,
      expectedCloseDate: closeDate || null,
      notes,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Opportunity</h2>
              <button type="button" onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Input required placeholder="Opportunity name" value={name} onChange={(e) => setName(e.target.value)} />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">New lead (no existing customer)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min="0" placeholder="Estimated value ($)" value={value} onChange={(e) => setValue(e.target.value)} />
              <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving || !name}>
              {saving ? "Creating…" : "Create Opportunity"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

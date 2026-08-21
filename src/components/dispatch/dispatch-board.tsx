"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, LayoutGrid, List as ListIcon } from "lucide-react";
import { updateLoadStatus, createLoad } from "@/app/(app)/dispatch/actions";
import type { Load, LoadStatus } from "@/lib/types/database";

type EnrichedLoad = Load & {
  customer: { name: string } | null;
  carrier: { name: string } | null;
  driver: { name: string } | null;
};

const COLUMNS: { status: LoadStatus; label: string; emoji: string }[] = [
  { status: "booked", label: "Booked", emoji: "📦" },
  { status: "covered", label: "Covered", emoji: "🚀" },
  { status: "pickup", label: "Pickup", emoji: "📍" },
  { status: "in_transit", label: "Transit", emoji: "🛣️" },
  { status: "delivered", label: "Delivered", emoji: "🏁" },
];

const RISK_ICON: Record<string, string> = { ok: "✅", warning: "🟡", critical: "🔴" };

export function DispatchBoard({
  loads,
  customers,
}: {
  loads: EnrichedLoad[];
  customers: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EnrichedLoad | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<LoadStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return loads;
    return loads.filter(
      (l) =>
        l.load_number.toLowerCase().includes(q) ||
        l.origin_summary?.toLowerCase().includes(q) ||
        l.destination_summary?.toLowerCase().includes(q) ||
        l.customer?.name.toLowerCase().includes(q) ||
        l.carrier?.name.toLowerCase().includes(q),
    );
  }, [loads, query]);

  function byStatus(status: LoadStatus) {
    return filtered.filter((l) => l.status === status);
  }

  function handleDrop(status: LoadStatus, loadId: string) {
    setDragOverCol(null);
    startTransition(() => updateLoadStatus(loadId, status));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dispatch Board</h1>
          <p className="text-sm text-muted-foreground">Drag loads between stages, or use the list view</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-accent-teal/15 text-accent-teal" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "list" ? "bg-accent-teal/15 text-accent-teal" : "text-muted-foreground"}`}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> New Load
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search load #, route, customer, carrier…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.status);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.status ? null : c))}
              onDrop={(e) => handleDrop(col.status, e.dataTransfer.getData("loadId"))}
              className={`flex min-h-[200px] flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors ${
                dragOverCol === col.status ? "border-accent-teal bg-accent-teal/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold">
                  {col.emoji} {col.label}
                </span>
                <Badge variant="neutral">{byStatus(col.status).length}</Badge>
              </div>
              {byStatus(col.status).map((load) => (
                <div
                  key={load.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("loadId", load.id)}
                  onClick={() => setSelected(load)}
                  className="cursor-pointer rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{load.load_number}</span>
                    <span title={load.risk_level}>{RISK_ICON[load.risk_level]}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {load.origin_summary} → {load.destination_summary}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {load.carrier?.name ?? "Unassigned"}
                    {load.driver?.name ? ` · ${load.driver.name}` : ""}
                  </p>
                </div>
              ))}
              {byStatus(col.status).length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">No loads</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Load</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Carrier / Driver</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((load) => (
                  <tr
                    key={load.id}
                    onClick={() => setSelected(load)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50"
                  >
                    <td className="px-4 py-3 font-medium">{load.load_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {load.origin_summary} → {load.destination_summary}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{load.carrier?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{COLUMNS.find((c) => c.status === load.status)?.label ?? load.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{RISK_ICON[load.risk_level]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selected && <LoadDetailPanel load={selected} onClose={() => setSelected(null)} />}
      {showNew && <NewLoadModal customers={customers} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function LoadDetailPanel({ load, onClose }: { load: EnrichedLoad; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm overflow-y-auto bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{load.load_number}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Badge variant="neutral" className="mt-2">
          {COLUMNS.find((c) => c.status === load.status)?.label ?? load.status}
        </Badge>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Route</p>
            <p>{load.origin_summary} → {load.destination_summary}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p>{load.customer?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carrier / Driver</p>
            <p>{load.carrier?.name ?? "Unassigned"}{load.driver?.name ? ` · ${load.driver.name}` : ""}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Equipment</p>
              <p>{load.equipment_type ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commodity</p>
              <p>{load.commodity ?? "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p>${Number(load.revenue).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margin</p>
              <p>${Number(load.margin).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <Link href={`/loads/${load.id}`} className="mt-5 block">
          <Button className="w-full">View full details</Button>
        </Link>
      </div>
    </div>
  );
}

function NewLoadModal({
  customers,
  onClose,
}: {
  customers: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [loadNumber, setLoadNumber] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("Dry Van");
  const [commodity, setCommodity] = useState("");
  const [revenue, setRevenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createLoad({
      loadNumber,
      customerId: customerId || null,
      originSummary: origin,
      destinationSummary: destination,
      equipmentType: equipment,
      commodity,
      revenue: Number(revenue) || 0,
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
              <h2 className="text-lg font-semibold">New Load</h2>
              <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Input required placeholder="Load number (e.g. LD-1050)" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No customer</option>
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
                {["Dry Van", "Reefer", "Flatbed", "Step Deck", "Power Only"].map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
              <Input placeholder="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
            </div>
            <Input type="number" min="0" placeholder="Revenue ($)" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Creating…" : "Create Load"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

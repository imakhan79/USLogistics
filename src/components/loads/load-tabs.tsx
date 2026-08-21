"use client";

import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Phone, Mail, StickyNote, Download, Eye } from "lucide-react";
import type { Document, Communication as CommunicationRow, Invoice, Load } from "@/lib/types/database";

type LoadStatusHistoryRow = { id: string; from_status: string | null; to_status: string; changed_at: string };
type Communication = CommunicationRow;

const DOC_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  validated: "success",
  active: "success",
  pending: "warning",
  expired: "danger",
};

const COMM_ICON = { email: Mail, call: Phone, sms: Phone, note: StickyNote };

export function LoadTabs({
  documents,
  communications,
  history,
  invoice,
  load,
}: {
  documents: Document[];
  communications: Communication[];
  history: LoadStatusHistoryRow[];
  invoice: Invoice | null;
  load: Load;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Tabs
          tabs={[
            { value: "details", label: "Details" },
            { value: "documents", label: "Documents" },
            { value: "communication", label: "Communication" },
            { value: "finance", label: "Finance" },
            { value: "history", label: "History" },
          ]}
        >
          {(active) => (
            <>
              {active === "details" && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Origin</p>
                    <p className="font-medium">{load.origin_summary ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium">{load.destination_summary ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup Date</p>
                    <p className="font-medium">{load.pickup_date ? new Date(load.pickup_date).toLocaleString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Date</p>
                    <p className="font-medium">{load.delivery_date ? new Date(load.delivery_date).toLocaleString() : "—"}</p>
                  </div>
                </div>
              )}

              {active === "documents" && (
                <div className="space-y-2">
                  {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents on file.</p>}
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={DOC_STATUS_VARIANT[doc.status] ?? "neutral"}>{doc.status}</Badge>
                        <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {active === "communication" && (
                <div className="space-y-2">
                  {communications.length === 0 && <p className="text-sm text-muted-foreground">No communication logged.</p>}
                  {communications.map((c) => {
                    const Icon = COMM_ICON[c.type] ?? StickyNote;
                    return (
                      <div key={c.id} className="flex gap-3 rounded-lg border border-border p-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{c.subject}</p>
                          <p className="text-xs text-muted-foreground">{c.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{new Date(c.occurred_at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {active === "finance" && (
                <div className="space-y-3 text-sm">
                  {invoice ? (
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "neutral"}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">${Number(invoice.amount).toLocaleString()} · due {invoice.due_date}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No invoice generated yet — this load hasn&apos;t been delivered.</p>
                  )}
                </div>
              )}

              {active === "history" && (
                <ol className="space-y-3 text-sm">
                  {history.length === 0 && <p className="text-muted-foreground">No status changes recorded.</p>}
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span>
                        {h.from_status ? `${h.from_status} → ${h.to_status}` : `Created as ${h.to_status}`}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(h.changed_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

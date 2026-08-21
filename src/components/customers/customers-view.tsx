"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineBoard } from "@/components/customers/pipeline-board";
import { List as ListIcon, GitBranch } from "lucide-react";
import type { Opportunity } from "@/lib/types/database";

type CustomerRow = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  loads: { revenue: number }[];
};

type EnrichedOpportunity = Opportunity & { customer: { id: string; name: string } | null };

export function CustomersView({
  customers,
  opportunities,
}: {
  customers: CustomerRow[];
  opportunities: EnrichedOpportunity[];
}) {
  const [view, setView] = useState<"directory" | "pipeline">("directory");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {view === "directory" ? `${customers.length} accounts on file` : `${opportunities.length} opportunities in the pipeline`}
          </p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView("directory")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "directory" ? "bg-accent-teal/15 text-accent-teal" : "text-muted-foreground"}`}
          >
            <ListIcon className="h-3.5 w-3.5" /> Directory
          </button>
          <button
            onClick={() => setView("pipeline")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "pipeline" ? "bg-accent-teal/15 text-accent-teal" : "text-muted-foreground"}`}
          >
            <GitBranch className="h-3.5 w-3.5" /> Pipeline
          </button>
        </div>
      </div>

      {view === "directory" ? (
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
                {customers.map((c) => {
                  const revenue = c.loads.reduce((sum, l) => sum + Number(l.revenue), 0);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/customers/${c.id}`} className="hover:text-accent-teal">{c.name}</Link>
                      </td>
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
      ) : (
        <PipelineBoard opportunities={opportunities} customers={customers.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </div>
  );
}

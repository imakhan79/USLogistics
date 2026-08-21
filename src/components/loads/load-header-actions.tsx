"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Truck, XCircle, Pencil } from "lucide-react";
import { updateLoadStatus } from "@/app/(app)/dispatch/actions";
import type { LoadStatus } from "@/lib/types/database";

const NEXT_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  booked: "covered",
  covered: "pickup",
  pickup: "in_transit",
  in_transit: "delivered",
};

export function LoadHeaderActions({ loadId, status }: { loadId: string; status: LoadStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = NEXT_STATUS[status];

  function advance() {
    if (!next) return;
    startTransition(async () => {
      await updateLoadStatus(loadId, next);
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      await updateLoadStatus(loadId, "cancelled");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
      {next && (
        <Button size="sm" disabled={isPending} onClick={advance}>
          <Truck className="h-3.5 w-3.5" /> Dispatch
        </Button>
      )}
      {status !== "cancelled" && status !== "delivered" && (
        <Button variant="danger" size="sm" disabled={isPending} onClick={cancel}>
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </Button>
      )}
      <Button variant="outline" size="sm">
        <Bot className="h-3.5 w-3.5" /> AI Actions
      </Button>
    </div>
  );
}

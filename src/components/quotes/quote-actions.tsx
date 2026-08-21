"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateQuoteStatus, convertQuoteToLoad } from "@/app/(app)/quotes/actions";
import type { QuoteStatus } from "@/lib/types/database";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [isPending, startTransition] = useTransition();

  if (status === "converted") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "quoted" && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(() => updateQuoteStatus(quoteId, "sent"))}>
          Mark Sent
        </Button>
      )}
      {(status === "quoted" || status === "sent") && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => startTransition(() => updateQuoteStatus(quoteId, "approved"))}>
            Approve
          </Button>
          <Button size="sm" variant="danger" disabled={isPending} onClick={() => startTransition(() => updateQuoteStatus(quoteId, "rejected"))}>
            Reject
          </Button>
        </>
      )}
      {status === "approved" && (
        <Button size="sm" disabled={isPending} onClick={() => startTransition(() => convertQuoteToLoad(quoteId))}>
          Convert to Load
        </Button>
      )}
    </div>
  );
}

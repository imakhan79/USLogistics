"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addCustomerNote } from "@/app/(app)/customers/actions";

export function AddNoteForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      await addCustomerNote(customerId, body.trim());
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Log a call, email, or note…"
        rows={2}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" disabled={isPending || !body.trim()}>
        {isPending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}

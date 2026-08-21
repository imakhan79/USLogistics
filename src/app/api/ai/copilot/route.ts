import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerCopilotQuestion } from "@/lib/ai/gemini";
import type { Load, ExceptionRow } from "@/lib/types/database";

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question?: string };
  if (!question?.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: loads }, { data: exceptions }, { data: trucks }] = await Promise.all([
    supabase.from("loads").select("*").order("created_at", { ascending: false }).limit(30),
    supabase
      .from("exceptions")
      .select("*, load:loads(load_number)")
      .eq("status", "open")
      .limit(15),
    supabase.from("trucks").select("status"),
  ]);

  const allLoads = (loads ?? []) as Load[];
  const openExceptions = (exceptions ?? []) as (ExceptionRow & { load: { load_number: string } | null })[];
  const availableTrucks = (trucks ?? []).filter((t) => t.status === "available").length;

  const summary = `
Active/recent loads (${allLoads.length}):
${allLoads
  .map(
    (l) =>
      `- ${l.load_number}: ${l.origin_summary} -> ${l.destination_summary}, status=${l.status}, risk=${l.risk_level}, revenue=$${l.revenue}, margin=$${l.margin}`,
  )
  .join("\n")}

Open exceptions (${openExceptions.length}):
${openExceptions.map((e) => `- ${e.load?.load_number ?? "?"}: ${e.severity} - ${e.category} - ${e.issue_summary}`).join("\n")}

Available trucks: ${availableTrucks}
`.trim();

  const { answer, model } = await answerCopilotQuestion(question, summary);
  return NextResponse.json({ answer, model });
}

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Which loads need attention right now?",
  "Why is margin lower than usual?",
  "Which carrier should cover an uncovered load?",
  "What can I do to reduce empty miles?",
];

export function Copilot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    setQuestion(q);
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "No response.");
    } catch {
      setAnswer("Something went wrong reaching the AI Copilot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-accent-teal" /> AI Copilot
        </CardTitle>
        <CardDescription>Ask about your loads, exceptions, and margins in plain English</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) ask(question.trim());
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask a question about your operations…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="cursor-pointer rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-accent-teal hover:text-accent-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        {answer && !loading && (
          <div className="whitespace-pre-wrap rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-4 text-sm">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

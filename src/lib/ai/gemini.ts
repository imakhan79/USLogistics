import { GoogleGenAI, Type } from "@google/genai";
import type { Load, ExceptionRow } from "@/lib/types/database";

const MODEL = "gemini-2.5-flash";

export interface GeneratedRecommendation {
  title: string;
  recommendation_text: string;
  action_type: "assign_carrier" | "optimize_backhaul" | "cover_load" | "other";
  estimated_cost: number | null;
  estimated_delay_minutes: number | null;
  confidence_score: number;
}

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      recommendation_text: { type: Type.STRING },
      action_type: {
        type: Type.STRING,
        enum: ["assign_carrier", "optimize_backhaul", "cover_load", "other"],
      },
      estimated_cost: { type: Type.NUMBER, nullable: true },
      estimated_delay_minutes: { type: Type.NUMBER, nullable: true },
      confidence_score: { type: Type.NUMBER },
    },
    required: ["title", "recommendation_text", "action_type", "confidence_score"],
  },
};

// Deterministic fallback used if the Gemini call fails or the key is missing,
// so the dashboard never shows an empty AI panel.
function ruleBasedFallback(
  atRiskLoads: Load[],
  openExceptions: ExceptionRow[],
): GeneratedRecommendation[] {
  const recs: GeneratedRecommendation[] = [];

  for (const load of atRiskLoads.slice(0, 2)) {
    if (!load.carrier_id) {
      recs.push({
        title: `Cover ${load.load_number}`,
        recommendation_text: `${load.load_number} (${load.origin_summary ?? "origin"} → ${
          load.destination_summary ?? "destination"
        }) has no carrier assigned yet. Source coverage now to protect the pickup window.`,
        action_type: "cover_load",
        estimated_cost: load.revenue ? Math.round(load.revenue * 0.72) : null,
        estimated_delay_minutes: null,
        confidence_score: 0.7,
      });
    } else {
      recs.push({
        title: `Review margin on ${load.load_number}`,
        recommendation_text: `${load.load_number} is running below target margin. Consider renegotiating carrier cost or reassigning to a lower-cost carrier.`,
        action_type: "assign_carrier",
        estimated_cost: null,
        estimated_delay_minutes: null,
        confidence_score: 0.6,
      });
    }
  }

  for (const exception of openExceptions.slice(0, 1)) {
    recs.push({
      title: "Address open exception",
      recommendation_text: exception.issue_summary,
      action_type: "other",
      estimated_cost: null,
      estimated_delay_minutes: 45,
      confidence_score: 0.55,
    });
  }

  return recs;
}

export async function generateLoadRecommendations(
  atRiskLoads: Load[],
  openExceptions: ExceptionRow[],
): Promise<{ recommendations: GeneratedRecommendation[]; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || atRiskLoads.length + openExceptions.length === 0) {
    return { recommendations: ruleBasedFallback(atRiskLoads, openExceptions), model: "rules" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the AI dispatch assistant for a U.S. freight brokerage. Given the at-risk loads and open exceptions below, propose up to 4 concrete, actionable recommendations a dispatcher could approve with one click. Be specific and reference load numbers.

At-risk loads:
${atRiskLoads.map((l) => `- ${l.load_number}: ${l.origin_summary} -> ${l.destination_summary}, status=${l.status}, risk=${l.risk_level}, revenue=$${l.revenue}, carrier_cost=$${l.carrier_cost}, carrier_assigned=${l.carrier_id ? "yes" : "no"}`).join("\n") || "none"}

Open exceptions:
${openExceptions.map((e) => `- ${e.category} (${e.severity}): ${e.issue_summary}`).join("\n") || "none"}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("empty Gemini response");

    const parsed = JSON.parse(text) as GeneratedRecommendation[];
    return { recommendations: parsed, model: MODEL };
  } catch (err) {
    console.error("Gemini recommendation generation failed, using fallback:", err);
    return { recommendations: ruleBasedFallback(atRiskLoads, openExceptions), model: "rules-fallback" };
  }
}

export async function answerCopilotQuestion(
  question: string,
  contextSummary: string,
): Promise<{ answer: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      answer: "AI Copilot is unavailable right now (no API key configured). Here's the raw data instead:\n\n" + contextSummary,
      model: "none",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the AI Copilot for a U.S. freight brokerage's operations platform. Answer the dispatcher's question using ONLY the data below — never invent load numbers, carriers, or figures that aren't present. If the data doesn't contain the answer, say so plainly. Keep the answer concise (under 120 words), and cite specific load numbers/figures from the data when relevant.

Live tenant data:
${contextSummary}

Question: ${question}`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const text = response.text;
    if (!text) throw new Error("empty Gemini response");
    return { answer: text.trim(), model: MODEL };
  } catch (err) {
    console.error("Gemini copilot call failed:", err);
    return {
      answer: "The AI Copilot couldn't reach the model just now. Here's the raw data instead:\n\n" + contextSummary,
      model: "error-fallback",
    };
  }
}

import { NextResponse } from "next/server";
import { AI_TONE_INSTRUCTIONS, callGroqJson, redactSensitiveFinancialText } from "@/lib/ai/groq";
import { logAiEvent } from "@/lib/ai/observability";
import { requireApiUser } from "@/lib/server-auth";
import { getEffectiveTier } from "@/lib/tier";

type NarrateInsight = {
  type?: string;
  title?: string;
  message?: string;
  supportingMetric?: string | null;
  severity?: string;
  categoryLabel?: string | null;
};

type NarrateBody = {
  placement?: "dashboard" | "reports" | "category";
  depth?: "basic" | "deep";
  insight?: NarrateInsight;
  evidence?: Record<string, string | number | null | undefined>;
};

type NarrateResult = { message: string; aiUsed: boolean };

export async function POST(request: Request) {
  const startedAt = Date.now();
  let tier: "free" | "premium" = "free";

  try {
    const body = (await request.json()) as NarrateBody;
    const insight = body.insight ?? {};
    const deterministicMessage = redactSensitiveFinancialText(String(insight.message ?? "")).trim();

    // The deterministic message is always the fallback: if AI is unavailable or
    // ungrounded, the user still sees the exact rules-computed observation.
    if (!deterministicMessage) {
      logAiEvent({ endpoint: "narrate", aiUsed: false, latencyMs: Date.now() - startedAt, fallback: true, tier });
      return NextResponse.json({ message: "", aiUsed: false } satisfies NarrateResult);
    }

    let depth: "basic" | "deep" = body.depth === "deep" ? "deep" : "basic";
    if (depth === "deep") {
      const auth = await requireApiUser(request);
      tier = auth.user ? getEffectiveTier(auth.user) : "free";
      if (tier !== "premium") depth = "basic"; // graceful downgrade, never 401
    }

    const evidence = sanitizeEvidence(body.evidence);
    const allowedNumbers = collectAllowedNumbers([
      deterministicMessage,
      insight.title ?? "",
      insight.supportingMetric ?? "",
      insight.categoryLabel ?? "",
      ...Object.values(evidence).map((value) => String(value))
    ]);

    const groq = await callGroqJson<{ message?: string }>({
      fallback: { message: deterministicMessage },
      maxTokens: depth === "deep" ? 260 : 160,
      messages: [
        {
          role: "system",
          content: [
            "You rewrite one already-computed budgeting observation into warm, plain language.",
            "The facts were produced by deterministic budget rules and are the only source of truth.",
            "Never invent, change, add, or remove any number, dollar amount, percentage, date, or category name.",
            "Only reference numbers and names that appear in the provided facts.",
            "Keep the same meaning and the same severity. Do not escalate or soften the situation.",
            "Do not give financial advice or tell the user what they must do.",
            depth === "deep"
              ? "You may add one short grounded follow-on sentence using only the provided evidence (such as projected spend or days remaining)."
              : "Return a single concise sentence.",
            "If the facts are too thin to improve, return the original message unchanged.",
            "Return JSON: { \"message\": string }.",
            AI_TONE_INSTRUCTIONS
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            placement: body.placement ?? "dashboard",
            severity: insight.severity ?? "calm",
            category: insight.categoryLabel ?? null,
            observation: deterministicMessage,
            supportingMetric: insight.supportingMetric ?? null,
            evidence
          })
        }
      ]
    });

    const candidate = typeof groq.data.message === "string" ? groq.data.message.trim() : "";
    const grounded = groq.aiUsed && candidate && isNumericallyGrounded(candidate, allowedNumbers);
    const message = grounded ? candidate.slice(0, 320) : deterministicMessage;
    const aiUsed = Boolean(grounded);

    logAiEvent({ endpoint: "narrate", aiUsed, latencyMs: Date.now() - startedAt, fallback: !aiUsed, tier });
    return NextResponse.json({ message, aiUsed } satisfies NarrateResult);
  } catch (error) {
    logAiEvent({ endpoint: "narrate", aiUsed: false, latencyMs: Date.now() - startedAt, fallback: true, tier, error });
    return NextResponse.json({ message: "", aiUsed: false } satisfies NarrateResult);
  }
}

function sanitizeEvidence(evidence: NarrateBody["evidence"]): Record<string, string | number> {
  if (!evidence || typeof evidence !== "object") return {};
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(evidence)) {
    if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === "string" && value.trim()) clean[key] = redactSensitiveFinancialText(value).trim().slice(0, 80);
  }
  return clean;
}

// Every run of digits the AI returns must already exist in the deterministic
// facts. This blocks the model from inventing balances, totals, or percentages.
function isNumericallyGrounded(text: string, allowed: Set<string>) {
  const numbers = extractNumberRuns(text);
  return numbers.every((number) => allowed.has(number));
}

function collectAllowedNumbers(sources: string[]) {
  const allowed = new Set<string>();
  sources.forEach((source) => extractNumberRuns(source).forEach((number) => allowed.add(number)));
  return allowed;
}

function extractNumberRuns(text: string) {
  // Normalize each numeric token so "$1,234.00", "1234", and "1234 dollars" compare
  // equal: drop commas, strip trailing decimal zeros, drop the decimal point if whole.
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((token) => {
    let normalized = token.replace(/,/g, "");
    if (normalized.includes(".")) normalized = normalized.replace(/0+$/, "").replace(/\.$/, "");
    return normalized.replace(/^0+(?=\d)/, "");
  });
}

import type { GroqJsonResult } from "@/lib/ai/types";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

type GroqJsonOptions<T> = {
  messages: GroqMessage[];
  fallback: T;
  maxTokens?: number;
};

export function hasGroqConfig() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function callGroqJson<T>({ messages, fallback, maxTokens = 900 }: GroqJsonOptions<T>): Promise<GroqJsonResult<T>> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { data: fallback, aiUsed: false };

  try {
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
        temperature: 0,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages
      })
    });

    if (!response.ok) return { data: fallback, aiUsed: false };

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { data: fallback, aiUsed: false };

    return { data: JSON.parse(content) as T, aiUsed: true };
  } catch {
    return { data: fallback, aiUsed: false };
  }
}

export function redactSensitiveFinancialText(text: string) {
  return text
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-card]")
    .replace(/\b(?:account|acct)\s*#?\s*\d{4,}\b/gi, "account [redacted]")
    .replace(/\b(?:routing)\s*#?\s*\d{6,}\b/gi, "routing [redacted]")
    .slice(0, 6000);
}

export const AI_TONE_INSTRUCTIONS = [
  "Keep tone calm, adult, concise, supportive, and non-shaming.",
  "Do not provide financial advice.",
  "Do not say the user failed.",
  "Do not use hype, emojis, or childish gamification.",
  "Return only strict JSON."
].join(" ");

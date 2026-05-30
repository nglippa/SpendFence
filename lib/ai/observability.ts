import "server-only";

export type AiEndpoint = "categorize-purchase" | "receipt-analysis" | "fence-suggestions" | "narrate";

type AiEventInput = {
  endpoint: AiEndpoint;
  aiUsed: boolean;
  latencyMs: number;
  fallback: boolean;
  tier?: "free" | "premium";
  error?: unknown;
};

// Structured server-side logging for every AI request so failures, fallbacks,
// and latency are observable rather than silently degrading.
export function logAiEvent({ endpoint, aiUsed, latencyMs, fallback, tier, error }: AiEventInput) {
  const event = {
    scope: "ai",
    endpoint,
    aiUsed,
    fallback,
    latencyMs: Math.round(latencyMs),
    ...(tier ? { tier } : {}),
    ...(error ? { error: error instanceof Error ? error.message : String(error) } : {})
  };

  if (error || (fallback && !aiUsed)) {
    console.warn("[ai]", JSON.stringify(event));
  } else {
    console.info("[ai]", JSON.stringify(event));
  }
}

// Wraps an AI handler body, timing it and emitting one structured event.
// The handler returns whether AI was actually used and whether a fallback was served.
export async function withAiObservability<T>(
  endpoint: AiEndpoint,
  run: () => Promise<{ result: T; aiUsed: boolean; fallback: boolean; tier?: "free" | "premium" }>
): Promise<T> {
  const startedAt = Date.now();
  try {
    const { result, aiUsed, fallback, tier } = await run();
    logAiEvent({ endpoint, aiUsed, latencyMs: Date.now() - startedAt, fallback, tier });
    return result;
  } catch (error) {
    logAiEvent({ endpoint, aiUsed: false, latencyMs: Date.now() - startedAt, fallback: true, error });
    throw error;
  }
}

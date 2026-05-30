"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { BehavioralInsight, BehavioralInsightPlacement } from "@/lib/insights/insight-types";
import { cn } from "@/lib/utils";

type InsightObservationProps = {
  insight: BehavioralInsight;
  placement: BehavioralInsightPlacement;
  label?: string;
  evidence?: Record<string, string | number | null | undefined>;
  className?: string;
};

// Renders the deterministic observation immediately, then enriches the message
// with grounded AI narration when it resolves. AI failure or staleness simply
// keeps the rules-computed text — the source of truth is always visible.
export function InsightObservation({ insight, placement, label = "Observation", evidence, className }: InsightObservationProps) {
  const auth = useAuth();
  const narrated = useNarratedMessage(insight, placement, evidence, auth);

  return (
    <div className={cn("border-l border-[rgb(139_151_220_/_0.35)] py-1 pl-3 sm:pl-4", className)}>
      <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-[var(--app-intelligence)]">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-[var(--app-text)] sm:text-base">{insight.title}</p>
      <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-[var(--app-text-secondary)] transition-opacity duration-300">{narrated}</p>
    </div>
  );
}

function useNarratedMessage(
  insight: BehavioralInsight,
  placement: BehavioralInsightPlacement,
  evidence: InsightObservationProps["evidence"],
  auth: ReturnType<typeof useAuth>
) {
  const [message, setMessage] = useState(insight.message);
  const evidenceRef = useRef(evidence);
  evidenceRef.current = evidence;

  useEffect(() => {
    setMessage(insight.message);
    // Empty-state nudges are onboarding copy, not worth an AI round-trip.
    if (insight.type === "empty") return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const depth = auth.effectiveTier === "premium" ? "deep" : "basic";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (depth === "deep") {
        const authed = await auth.authHeaders().catch(() => ({}));
        Object.assign(headers, authed);
      }

      try {
        const response = await fetch("/api/ai/narrate", {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            placement,
            depth,
            insight: {
              type: insight.type,
              title: insight.title,
              message: insight.message,
              supportingMetric: insight.supportingMetric ?? null,
              severity: insight.severity,
              categoryLabel: insight.categoryLabel ?? null
            },
            evidence: evidenceRef.current
          })
        });
        if (!response.ok) return;
        const data = (await response.json()) as { message?: string; aiUsed?: boolean };
        if (!cancelled && data.aiUsed && data.message) setMessage(data.message);
      } catch {
        // Keep the deterministic message on any failure.
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [insight.id, insight.message, insight.title, insight.type, insight.severity, insight.supportingMetric, insight.categoryLabel, placement, auth]);

  return message;
}

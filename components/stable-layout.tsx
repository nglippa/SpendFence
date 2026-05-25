"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const COLLAPSE_DURATION_MS = 220;

export function StableCollapsible({
  open,
  children,
  className,
  innerClassName
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [rendered, setRendered] = useState(open);
  const [expanded, setExpanded] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      if (prefersReducedMotion) {
        setExpanded(true);
        return;
      }

      const frame = window.requestAnimationFrame(() => setExpanded(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setExpanded(false);

    if (prefersReducedMotion) {
      setRendered(false);
      return;
    }

    const timer = window.setTimeout(() => setRendered(false), COLLAPSE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, prefersReducedMotion]);

  if (!rendered) return null;

  return (
    <div
      aria-hidden={!expanded}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className={cn("min-h-0 overflow-hidden", innerClassName)}>{children}</div>
    </div>
  );
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);

    function updatePreference(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function scrollIntoViewIfNeeded(element: HTMLElement | null, options: { topOffset?: number; bottomOffset?: number } = {}) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const topOffset = options.topOffset ?? 88;
  const bottomOffset = options.bottomOffset ?? 110;
  const visibleTop = topOffset;
  const visibleBottom = window.innerHeight - bottomOffset;

  if (rect.top < visibleTop || rect.bottom > visibleBottom) {
    element.scrollIntoView({ behavior: "auto", block: "nearest" });
  }
}

export function stableLayoutDelay(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? 0 : COLLAPSE_DURATION_MS;
}

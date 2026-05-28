"use client";

import Link from "next/link";
import { Button, Pill } from "@/components/ui";

export function PremiumBadge() {
  return <Pill className="border-[rgb(75_140_255_/_0.18)] bg-[rgb(75_140_255_/_0.08)] text-[var(--app-info)]">Premium</Pill>;
}

export function ProBadge() {
  return <PremiumBadge />;
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0B1114]/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-float">
        <Link href="/pricing" className="inline-flex transition hover:brightness-105">
          <PremiumBadge />
        </Link>
        <h2 className="mt-4 text-2xl font-black text-[var(--app-text)]">Premium unlocks deeper SpendFence intelligence.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">
          Upgrade to unlock unlimited Teller account linking, advanced pattern recognition, and richer adaptive insights.
        </p>
        <div className="mt-5 grid gap-2">
          <Button asChild className="w-full">
            <Link href="/pricing">View Premium Plans</Link>
          </Button>
          <Button className="w-full" variant="secondary" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

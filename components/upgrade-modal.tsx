"use client";

import { X, Zap } from "lucide-react";
import Link from "next/link";
import { Button, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export function ProBadge() {
  return <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">Pro</Pill>;
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#10201c]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-5 shadow-float">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
            <Zap size={22} />
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl text-slate-500 hover:bg-slate-100" aria-label="Close upgrade modal">
            <X size={18} />
          </button>
        </div>
        <ProBadge />
        <h2 className="mt-4 text-2xl font-black text-[#10201c]">Bank sync is a Pro feature.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Pro unlocks Plaid Sandbox bank connection, automatic transaction imports, connected account management, review queues, and smart category suggestions.
        </p>
        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            onClick={async () => {
              const result = await auth.startUpgrade();
              if (result.error) return;
              onClose();
            }}
          >
            Upgrade to Pro
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
          No payment is processed in this placeholder flow until Stripe keys and checkout are configured.
        </p>
      </div>
    </div>
  );
}

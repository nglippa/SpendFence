"use client";

import { Button, Pill } from "@/components/ui";

export function PremiumBadge() {
  return <Pill className="border-[#d9e7ff] bg-[#f4f8ff] text-[#315f96]">Premium</Pill>;
}

export function ProBadge() {
  return <PremiumBadge />;
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#10201c]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-5 shadow-float">
        <PremiumBadge />
        <h2 className="mt-4 text-2xl font-black text-[#10201c]">Premium features are planned.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          SpendFence is marking future Premium areas now, but subscriptions and payment checkout are not enabled yet.
        </p>
        <Button className="mt-5 w-full" variant="secondary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}

import { BrandLogo } from "@/components/brand-logo";

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--app-bg)] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="text-center">
        <BrandLogo className="mx-auto h-20 w-auto" />
        <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">SpendFence</p>
      </div>
    </main>
  );
}

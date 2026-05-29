"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";

type CheckoutPlan = "monthly" | "yearly";

export default function CheckoutPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const startedPlanRef = useRef<CheckoutPlan | null>(null);
  const plan = normalizePlan(searchParams.get("plan"));

  useEffect(() => {
    if (!plan) {
      setError("Choose a Premium plan to continue.");
      return;
    }

    if (auth.loading) return;

    if (!auth.user || auth.user.isDemo) {
      startedPlanRef.current = null;
      const loginPath = `/login?next=/checkout&plan=${plan}`;
      if (auth.user?.isDemo) {
        auth.signOut().finally(() => router.replace(loginPath));
        return;
      }
      router.replace(loginPath);
      return;
    }

    if (startedPlanRef.current === plan) return;
    startedPlanRef.current = plan;
    setError("");

    auth.startUpgrade(plan).then((result) => {
      if (!result.error) return;
      startedPlanRef.current = null;
      setError("Checkout is temporarily unavailable. Please try again in a moment.");
    });
  }, [auth, auth.loading, auth.user, plan, retryKey, router]);

  function tryAgain() {
    startedPlanRef.current = null;
    setError("");
    setRetryKey((current) => current + 1);
  }

  const title = error ? "Checkout needs a moment." : "Preparing secure checkout...";
  const body = error
    ? error
    : plan
      ? `Opening Stripe Checkout for SpendFence Premium ${plan === "yearly" ? "Yearly" : "Monthly"}.`
      : "Choose a Premium plan to continue.";

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_20%_0%,rgb(121_131_189_/_0.12),transparent_24rem),var(--app-bg)] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <Card className="w-full max-w-md overflow-hidden border-[rgb(121_131_189_/_0.18)] bg-[radial-gradient(circle_at_10%_0%,rgb(121_131_189_/_0.12),transparent_16rem),var(--app-card)] p-5 text-center shadow-[0_24px_70px_rgb(0_0_0_/_0.22)] sm:p-6">
        <BrandLogo className="mx-auto h-14 w-auto" />
        <Pill className="mt-5 border-[rgb(127_151_189_/_0.18)] bg-[rgb(127_151_189_/_0.08)] text-[var(--app-info)]">
          <ShieldCheck size={13} /> Stripe secured
        </Pill>
        <div className="mx-auto mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#20283A,#6F7FB0_52%,#7771A8)] text-white shadow-[0_16px_34px_rgb(0_0_0_/_0.22)]">
          {error ? <LockKeyhole size={21} /> : <RefreshCw size={21} className="animate-spin" />}
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-[var(--app-text)]">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-bold leading-6 text-[var(--app-text-secondary)]">{body}</p>

        {error ? (
          <div className="mt-6 grid gap-2">
            {plan ? (
              <Button type="button" onClick={tryAgain}>
                <RefreshCw size={17} /> Try again
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/pricing">
                <ArrowLeft size={17} /> Back to Pricing
              </Link>
            </Button>
          </div>
        ) : null}
      </Card>
    </main>
  );
}

function normalizePlan(value: string | null): CheckoutPlan | null {
  if (value === "monthly" || value === "yearly") return value;
  return null;
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Bot, Building2, CheckCircle2, Crown, ExternalLink, ReceiptText, Sparkles } from "lucide-react";
import { SettingsDetailHeader } from "@/components/settings-ui";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { premiumFeatures } from "@/lib/premium-features";
import { cn } from "@/lib/utils";

const premiumPlanFeatures = [
  "Unlimited Teller-linked accounts",
  "Advanced intelligence labels and deeper insights",
  "Adaptive AI recommendations",
  "Advanced pattern recognition",
  "Future account-based fence setup"
];

const comparisonRows = [
  { feature: "Manual fences", free: true, premium: true },
  { feature: "Manual purchases", free: true, premium: true },
  { feature: "Receipt scan", free: true, premium: true },
  { feature: "Basic intelligence", free: true, premium: true },
  { feature: "Teller-linked accounts", free: "2", premium: "Unlimited" },
  { feature: "Advanced intelligence", free: false, premium: true },
  { feature: "Adaptive AI recommendations", free: false, premium: true },
  { feature: "Future account-based setup", free: false, premium: true }
];

export default function PremiumSettingsPage() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [busyPlan, setBusyPlan] = useState<"monthly" | "yearly" | "portal" | null>(null);
  const [message, setMessage] = useState("");
  const subscribed = auth.realTier === "premium";
  const currentPriceId = auth.subscription?.price_id;
  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY;
  const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_YEARLY;
  const checkoutSuccess = searchParams.get("success") === "true";
  const checkoutCanceled = searchParams.get("canceled") === "true";
  const cancellationCopy = useMemo(() => {
    if (!auth.subscription || auth.subscription.status === "active" || auth.subscription.status === "trialing") return "";
    return `Billing status: ${auth.subscription.status}. Premium unlocks return when Stripe reports an active subscription.`;
  }, [auth.subscription]);

  async function upgrade(plan: "monthly" | "yearly") {
    setBusyPlan(plan);
    setMessage("");
    const result = await auth.startUpgrade(plan);
    if (result.error) setMessage(result.error);
    setBusyPlan(null);
  }

  async function manageBilling() {
    setBusyPlan("portal");
    setMessage("");
    const result = await auth.manageBilling();
    if (result.error) setMessage(result.error);
    setBusyPlan(null);
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-4xl">
      <SettingsDetailHeader title="Premium" subtitle="Unlock advanced budgeting intelligence." />

      <div className="grid gap-5">
        {(checkoutSuccess || checkoutCanceled || message || cancellationCopy) ? (
          <Card className={cn("border-sky-100 bg-sky-50/80", checkoutCanceled && "border-amber-100 bg-amber-50/80")}>
            <p className="text-sm font-black text-[#10201c]">
              {checkoutSuccess ? "Checkout complete. Your Premium status will update as soon as Stripe confirms the subscription." : null}
              {checkoutCanceled ? "Checkout canceled. Nothing changed on your account." : null}
              {!checkoutSuccess && !checkoutCanceled ? message || cancellationCopy : null}
            </p>
          </Card>
        ) : null}

        <Card className="overflow-hidden border-[rgb(79_70_229_/_0.18)] bg-[radial-gradient(circle_at_10%_0%,rgb(124_58_237_/_0.12),transparent_18rem),linear-gradient(145deg,#FFFFFF,#F6F8FF)] shadow-[0_22px_64px_rgb(15_23_42_/_0.10)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_10%_0%,rgb(99_102_241_/_0.16),transparent_20rem),linear-gradient(145deg,#151B26,#0F141D)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={subscribed ? "border-sky-100 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600"}>
                  Current Plan: {auth.planLabel}
                </Pill>
                {auth.isDeveloper ? <Pill className="border-violet-100 bg-violet-50 text-violet-700">Developer Preview: {auth.planLabel}</Pill> : null}
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--app-text)] sm:text-3xl">Adaptive budgeting, unlocked.</h2>
              <p className="mt-2 max-w-2xl text-xs font-bold leading-5 text-[var(--app-text-secondary)] sm:text-sm sm:leading-6">
                Unlimited bank linking, advanced intelligence, and deeper recommendations.
              </p>
            </div>
            {subscribed ? (
              <Button variant="secondary" onClick={manageBilling} disabled={busyPlan === "portal"} className="shrink-0">
                <ExternalLink size={17} /> Manage Billing
              </Button>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <PricingCard
            title="Monthly"
            price="$8"
            cadence="/mo"
            active={subscribed && currentPriceId === monthlyPriceId}
            disabled={!monthlyPriceId || busyPlan !== null}
            loading={busyPlan === "monthly"}
            onClick={() => upgrade("monthly")}
          />
          <PricingCard
            title="Yearly"
            price="$72"
            cadence="/yr"
            badge="Save 25%"
            active={subscribed && currentPriceId === yearlyPriceId}
            disabled={!yearlyPriceId || busyPlan !== null}
            loading={busyPlan === "yearly"}
            onClick={() => upgrade("yearly")}
          />
        </div>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Crown size={18} className="text-[#4F46E5]" />
            <h2 className="text-base font-black sm:text-xl">Premium includes</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {premiumPlanFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2 rounded-2xl bg-[var(--app-secondary)] p-3 text-sm font-black text-[var(--app-text)]">
                <CheckCircle2 size={16} className="text-[#4F46E5]" />
                {feature}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-black sm:text-xl">Feature comparison</h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--app-border)]">
            {comparisonRows.map((row, index) => (
              <div key={row.feature} className={cn("grid grid-cols-[1.2fr_0.7fr_0.9fr] items-center gap-2 px-3 py-3 text-sm font-bold", index % 2 === 0 ? "bg-[var(--app-secondary)]" : "bg-[var(--app-card)]")}>
                <span className="text-[var(--app-text)]">{row.feature}</span>
                <ComparisonValue value={row.free} />
                <ComparisonValue value={row.premium} premium />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="grid gap-4 md:grid-cols-4">
            <PremiumFeature icon={Building2} title="Bank linking" body={premiumFeatures["bank-sync"].description} />
            <PremiumFeature icon={Bot} title="AI intelligence" body={premiumFeatures["advanced-ai-intelligence"].description} />
            <PremiumFeature icon={BarChart3} title="Analytics" body={premiumFeatures["advanced-analytics"].description} />
            <PremiumFeature icon={ReceiptText} title="Core tools stay free" body="Manual budgets, purchases, and receipt scanning remain available on Free." />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  cadence,
  badge,
  active,
  disabled,
  loading,
  onClick
}: {
  title: string;
  price: string;
  cadence: string;
  badge?: string;
  active: boolean;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Card className={cn("border-[rgb(99_102_241_/_0.14)]", active && "border-sky-200 bg-sky-50/70")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black sm:text-xl">{title}</h2>
            {badge ? <Pill className="border-violet-100 bg-violet-50 text-violet-700">{badge}</Pill> : null}
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight sm:mt-3 sm:text-3xl">
            {price} <span className="text-sm font-black text-[var(--app-text-muted)]">{cadence}</span>
          </p>
        </div>
        {active ? <Pill className="border-sky-100 bg-sky-50 text-sky-700">Current</Pill> : null}
      </div>
      <Button className="mt-5 w-full" onClick={onClick} disabled={disabled || active}>
        <Sparkles size={17} /> {loading ? "Opening" : active ? "Current Plan" : "Upgrade"}
      </Button>
    </Card>
  );
}

function ComparisonValue({ value, premium = false }: { value: boolean | string; premium?: boolean }) {
  if (typeof value === "string") return <span className={premium ? "font-black text-[#4F46E5]" : "text-[var(--app-text-secondary)]"}>{value}</span>;
  return value ? <CheckCircle2 size={17} className={premium ? "text-[#4F46E5]" : "text-[var(--app-success)]"} /> : <span className="text-[var(--app-text-muted)]">-</span>;
}

function PremiumFeature({ icon: Icon, title, body }: { icon: typeof Building2; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-[var(--app-secondary)] p-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4F46E5] shadow-soft dark:bg-white/[0.08]">
        <Icon size={18} />
      </div>
      <h3 className="mt-3 text-sm font-black text-[var(--app-text)]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)]">{body}</p>
    </div>
  );
}

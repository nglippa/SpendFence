"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  LockKeyhole,
  LucideIcon,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { ProgressBar } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type MarketingPageKey = "home" | "philosophy" | "adaptive-ai" | "features" | "security" | "pricing";

const navItems = [
  { href: "/", label: "Home", key: "home" },
  { href: "/philosophy", label: "Philosophy", key: "philosophy" },
  { href: "/adaptive-ai", label: "Adaptive AI", key: "adaptive-ai" },
  { href: "/features", label: "Features", key: "features" },
  { href: "/security", label: "Security", key: "security" },
  { href: "/pricing", label: "Pricing", key: "pricing" }
] satisfies Array<{ href: string; label: string; key: MarketingPageKey }>;

const featureCards = [
  {
    icon: Sparkles,
    title: "Adaptive Fences",
    body: "Flexible category boundaries that evolve as real spending patterns become clearer."
  },
  {
    icon: Brain,
    title: "Smart Insights",
    body: "Behavior-aware guidance that explains what changed without guilt, noise, or finance theater."
  },
  {
    icon: Camera,
    title: "Receipt Scanning",
    body: "Review receipt details and AI-assisted category suggestions before anything is saved."
  },
  {
    icon: CalendarClock,
    title: "Recurring Detection",
    body: "Track subscriptions and repeat bills so fixed costs do not blur flexible spending."
  },
  {
    icon: ClipboardCheck,
    title: "Spending Rules",
    body: "Create lightweight personal guardrails for thresholds, timing, frequency, and pacing."
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    body: "Designed for quick iPhone checks, safe-area polish, and app-like everyday use."
  }
];

const premiumFeatureHighlights = [
  "Unlimited bank syncing",
  "Advanced intelligence",
  "Adaptive fence recommendations",
  "Deeper spending insights",
  "Enhanced pacing analysis",
  "Future predictive budgeting tools"
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.2, 0.8, 0.2, 1] } }
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export function MarketingShell({ page, children }: { page: MarketingPageKey; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [scrolled, setScrolled] = useState(false);

  async function openAuthRoute(path: "/login" | "/dashboard") {
    if (auth.user?.isDemo) await auth.signOut();
    router.push(path);
  }

  const signedIn = Boolean(auth.user && !auth.user.isDemo);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-[var(--marketing-bg)] text-[var(--marketing-text)]">
      <div className="landing-bg pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgb(31_209_165_/_0.16),transparent_34rem)] opacity-90 dark:opacity-100" />
      <header
        className={cn(
          "sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-all duration-300",
          scrolled
            ? "border-[var(--marketing-border)] bg-[rgb(var(--marketing-nav))] shadow-[0_14px_40px_rgb(0_0_0_/_0.10)] backdrop-blur-2xl"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-2xl transition hover:opacity-90">
            <img src="/brand/spendfence-logo-dark.png" alt="SpendFence" className="h-10 w-auto shrink-0 object-contain dark:block" />
            <span className="truncate text-lg font-black tracking-tight text-[var(--marketing-text)]">SpendFence</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-pill)] p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || page === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-black transition-colors",
                    active ? "text-[var(--marketing-active-text)]" : "text-[var(--marketing-muted)] hover:text-[var(--marketing-text)]"
                  )}
                >
                  {active ? <motion.span layoutId="marketing-nav-pill" className="absolute inset-0 rounded-full bg-[var(--marketing-active-pill)]" transition={{ duration: 0.28 }} /> : null}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthRoute(signedIn ? "/dashboard" : "/login")}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-pill)] px-4 text-sm font-black text-[var(--marketing-text)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] transition hover:-translate-y-0.5 hover:bg-[var(--marketing-pill-strong)]"
            >
              {signedIn ? "Open App" : "Sign In"}
            </button>
            <Link
              href="/demo"
              className="hidden min-h-10 items-center justify-center rounded-2xl border border-[rgb(31_209_165_/_0.26)] bg-[rgb(31_209_165_/_0.10)] px-4 text-sm font-black text-[var(--marketing-accent)] shadow-[0_18px_44px_rgb(31_209_165_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[rgb(31_209_165_/_0.16)] sm:inline-flex"
            >
              Try Demo
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-3 text-sm font-black text-[var(--marketing-muted)] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 transition",
                pathname === item.href ? "border-[rgb(31_209_165_/_0.32)] bg-[rgb(31_209_165_/_0.12)] text-[var(--marketing-accent)]" : "border-[var(--marketing-border)] bg-[var(--marketing-pill)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <motion.main initial="hidden" animate="show" variants={stagger} className="relative z-10">
        {children}
      </motion.main>
    </div>
  );
}

export function HomeMarketingPage() {
  return (
    <MarketingShell page="home">
      <HeroSection />
      <FrustrationFlow />
      <AdaptiveCenterpiece />
      <AiPreview />
      <FeatureGridSection />
      <MobilePreview />
      <VisionPreview />
      <FinalCta />
    </MarketingShell>
  );
}

export function PhilosophyMarketingPage() {
  const ideas = [
    ["Rigid budgets fail because life moves", "A budget made on the first day of a cycle often breaks the moment real decisions show up."],
    ["Boundaries work better than punishment", "SpendFence frames spending limits as fences: visible, adjustable boundaries that help you notice pace."],
    ["Behavior is better input than shame", "Realistic budgeting starts by observing what actually happens, not by demanding perfect restraint."],
    ["Pacing beats restriction", "The goal is to understand speed, rhythm, and pressure before money decisions feel urgent."]
  ];

  return (
    <MarketingShell page="philosophy">
      <PageHero
        eyebrow="Product Philosophy"
        title="Budgeting should adapt to behavior, not punish it."
        body="SpendFence is built for people who want clearer spending boundaries without turning their financial life into a rigid accounting exercise."
      />
      <SectionShell>
        <motion.div variants={stagger} className="grid gap-4 md:grid-cols-2">
          {ideas.map(([title, body]) => (
            <MotionCard key={title}>
              <h2 className="text-2xl font-black leading-tight text-[var(--marketing-text)]">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
            </MotionCard>
          ))}
        </motion.div>
      </SectionShell>
      <StatementBand title="You stay in control. SpendFence helps you see the pattern." body="Adaptive pacing turns financial awareness into a calmer feedback loop: observe, understand, adjust, approve." />
    </MarketingShell>
  );
}

export function AdaptiveAiMarketingPage() {
  const steps = [
    ["Connect and observe", "Future read-only account learning lets SpendFence understand your spending rhythm before proposing anything."],
    ["Recognize patterns", "AI-assisted intelligence can identify pacing shifts, recurring pressure, late-cycle strain, and realistic category ranges."],
    ["Suggest fences", "SpendFence proposes boundaries that fit observed behavior instead of asking users to invent perfect limits upfront."],
    ["User approves", "AI suggests. Users approve. Every meaningful change remains collaborative and visible."]
  ];

  return (
    <MarketingShell page="adaptive-ai">
      <PageHero
        eyebrow="Adaptive AI"
        title="AI-assisted budgeting that collaborates instead of commands."
        body="SpendFence combines receipt analysis, category suggestions, smart insights, and adaptive fence recommendations into one restrained intelligence layer."
      />
      <SectionShell>
        <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <AnimatedDashboardMockup />
          <motion.div variants={stagger} className="grid gap-3">
            {steps.map(([title, body], index) => (
              <MotionCard key={title} className="p-4">
                <div className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[rgb(31_209_165_/_0.12)] text-sm font-black text-[var(--marketing-accent)]">{index + 1}</span>
                  <div>
                    <h2 className="font-black text-[var(--marketing-text)]">{title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
                  </div>
                </div>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </SectionShell>
      <StatementBand title="AI suggests. Users approve." body="The long-term vision is an adaptive onboarding system where users spend normally for a period, then review realistic starting fences shaped by actual behavior." />
    </MarketingShell>
  );
}

export function FeaturesMarketingPage() {
  return (
    <MarketingShell page="features">
      <PageHero
        eyebrow="Features"
        title="Everything needed for adaptive spending intelligence."
        body="SpendFence brings fences, insights, rules, receipts, recurring charges, and mobile-first workflows into one calm product surface."
      />
      <FeatureGridSection />
      <MockupStrip />
    </MarketingShell>
  );
}

export function SecurityMarketingPage() {
  const items = [
    ["Privacy-first mindset", "The product is designed around user control, transparent suggestions, and careful data boundaries."],
    ["Future read-only integrations", "Future account linking is planned as read-only learning, not money movement."],
    ["User-controlled approvals", "Adaptive changes stay optional until a user chooses to accept them."],
    ["No financial advice", "SpendFence surfaces patterns and pacing signals; it does not tell users what they must do."],
    ["Secure architecture direction", "Provider tokens and sensitive integrations belong server-side, with minimal client exposure."]
  ];

  return (
    <MarketingShell page="security">
      <PageHero
        eyebrow="Security"
        title="Trust is designed into the product model."
        body="SpendFence is calm financial intelligence, not financial control. Suggestions stay optional, integrations stay careful, and users remain the final decision-maker."
      />
      <SectionShell>
        <motion.div variants={stagger} className="grid gap-4 md:grid-cols-2">
          {items.map(([title, body]) => (
            <MotionCard key={title}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(31_209_165_/_0.10)] text-[var(--marketing-accent)]">
                <LockKeyhole size={20} />
              </div>
              <h2 className="mt-5 text-xl font-black text-[var(--marketing-text)]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
            </MotionCard>
          ))}
        </motion.div>
      </SectionShell>
    </MarketingShell>
  );
}

export function PricingMarketingPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyPlan, setBusyPlan] = useState<"monthly" | "yearly" | null>(null);
  const [message, setMessage] = useState("");

  const intentPlan = searchParams.get("plan") === "yearly" ? "yearly" : searchParams.get("plan") === "monthly" ? "monthly" : null;
  const checkoutCanceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (!intentPlan) return;
    router.replace(`/checkout?plan=${intentPlan}`);
  }, [intentPlan, router]);

  async function startPremium(plan: "monthly" | "yearly") {
    setBusyPlan(plan);
    setMessage("");
    if (auth.user?.isDemo) await auth.signOut();
    router.push(`/checkout?plan=${plan}`);
  }

  async function startFree() {
    if (auth.user && !auth.user.isDemo) {
      router.push("/dashboard");
      return;
    }

    if (auth.user?.isDemo) await auth.signOut();
    router.push("/login?next=/dashboard");
  }

  return (
    <MarketingShell page="pricing">
      <PageHero
        eyebrow="Pricing"
        title="Premium intelligence for adaptive budgeting."
        body="Start with core budgeting for free, or unlock unlimited syncing, deeper insights, and adaptive fence recommendations with Premium."
      />
      <SectionShell>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr_1fr]">
          <PricingCard
            title="Free"
            price="$0"
            cadence="/month"
            body="For manual budgeting with basic intelligence and adaptive guidance."
            cta="Start Free"
            onClick={startFree}
            features={["Manual budgeting", "Basic intelligence", "Receipt scanning", "Adaptive suggestions", "Spending rules"]}
          />
          <PricingCard
            title="Premium Monthly"
            price="$8"
            cadence="/month"
            body="For full SpendFence intelligence with unlimited account syncing and deeper cycle analysis."
            cta={busyPlan === "monthly" ? "Opening Checkout..." : "Start Monthly"}
            onClick={() => startPremium("monthly")}
            disabled={busyPlan !== null}
            highlighted
            features={premiumFeatureHighlights}
          />
          <PricingCard
            title="Premium Yearly"
            price="$72"
            cadence="/year"
            badge="Save 25% annually"
            body="The best value for users who want SpendFence to become a daily financial rhythm."
            cta={busyPlan === "yearly" ? "Opening Checkout..." : "Start Yearly"}
            onClick={() => startPremium("yearly")}
            disabled={busyPlan !== null}
            highlighted
            features={premiumFeatureHighlights}
          />
        </div>
        <PricingComparison />
        {message || checkoutCanceled ? (
          <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-center text-sm font-black text-amber-500">
            {message || "Checkout canceled. Nothing changed on your account."}
          </div>
        ) : null}
        <div className="mt-5 flex justify-center">
          <SecondaryCta href="/demo">Try Demo</SecondaryCta>
        </div>
      </SectionShell>
    </MarketingShell>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[45rem] bg-[radial-gradient(circle_at_18%_14%,rgb(31_209_165_/_0.18),transparent_28rem),radial-gradient(circle_at_86%_20%,rgb(94_161_255_/_0.10),transparent_30rem)]" />
      <div className="relative mx-auto grid min-h-[88svh] max-w-7xl gap-11 px-5 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-20">
        <motion.div variants={fadeUp} className="max-w-3xl text-center lg:text-left">
          <Badge>Adaptive AI-assisted spending intelligence</Badge>
          <h1 className="mt-6 text-[3.45rem] font-black leading-[0.98] tracking-[-0.04em] text-[var(--marketing-text)] sm:text-7xl lg:text-[5.35rem]">
            Budgeting that adapts to how you actually live.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-8 text-[var(--marketing-muted)] sm:text-lg lg:mx-0">
            SpendFence turns real behavior into calm spending fences, AI-assisted insights, and decisions you approve before anything changes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <PrimaryCta href="/premium">Start Premium</PrimaryCta>
            <SecondaryCta href="/demo">Try Demo</SecondaryCta>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2 text-left sm:max-w-xl lg:max-w-lg">
            {[
              ["AI-assisted", "insights"],
              ["User-approved", "changes"],
              ["Mobile-first", "daily rhythm"]
            ].map(([top, bottom]) => (
              <div key={top} className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-pill)] p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
                <p className="text-xs font-black text-[var(--marketing-text)]">{top}</p>
                <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--marketing-muted)]">{bottom}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <AnimatedDashboardMockup />
      </div>
    </section>
  );
}

function FrustrationFlow() {
  const story = [
    ["Budgeting frustration", "Most apps ask for a perfect plan before they understand your actual life."],
    ["Rigid systems fail", "A single unexpected week can make a neat category limit feel useless."],
    ["Humans are inconsistent", "Spending has rhythm, pressure, timing, and emotion. That context matters."],
    ["SpendFence adapts", "The product watches pacing, learns patterns, and turns behavior into useful boundaries."]
  ];

  return (
    <SectionShell eyebrow="The shift" title="The app is not asking you to become a spreadsheet.">
      <motion.div variants={stagger} className="grid gap-3 md:grid-cols-4">
        {story.map(([title, body], index) => (
          <MotionCard key={title} className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">0{index + 1}</p>
            <h3 className="mt-4 text-lg font-black leading-6 text-[var(--marketing-text)]">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
          </MotionCard>
        ))}
      </motion.div>
    </SectionShell>
  );
}

function AdaptiveCenterpiece() {
  return (
    <SplitSection
      eyebrow="Adaptive budgeting"
      title="Fences that move with your actual rhythm."
      body="SpendFence helps users see pace, pressure, and recurring behavior early enough to adjust with intention. It is designed to feel like financial awareness, not financial surveillance."
      ctaHref="/adaptive-ai"
      ctaLabel="Explore Adaptive AI"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgb(31_209_165_/_0.20)] bg-[linear-gradient(145deg,var(--marketing-panel),var(--marketing-panel-strong))] p-4 shadow-[var(--marketing-shadow)] sm:p-5">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[rgb(31_209_165_/_0.14)] blur-3xl" />
        <div className="relative grid gap-3">
          {[
            ["Eating out", "Pacing 18% faster than usual", 82, "#F5B942"],
            ["Groceries", "Stable against monthly rhythm", 58, "#1FD1A5"],
            ["Subscriptions", "Recurring charges detected", 42, "#5EA1FF"]
          ].map(([name, note, percent, color]) => (
            <motion.div
              key={name}
              className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-4"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--marketing-text)]">{name}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--marketing-muted)]">{note}</p>
                </div>
                <Sparkles size={17} className="text-[var(--marketing-accent)]" />
              </div>
              <ProgressBar percent={Number(percent)} color={String(color)} />
            </motion.div>
          ))}
        </div>
      </div>
    </SplitSection>
  );
}

function AiPreview() {
  return (
    <SplitSection
      eyebrow="AI assists, user approves"
      title="Intelligence that supports decisions without taking them over."
      body="Receipt analysis, category suggestions, smart insights, and adaptive fence recommendations work together to make budgeting feel clearer and less brittle."
      ctaHref="/features"
      ctaLabel="See the surfaces"
      reverse
    >
      <div className="grid gap-3">
        {([
          ["AI insight", "Dining is moving faster than your normal cycle pace.", Brain],
          ["Recurring detection", "Streamly looks like a monthly subscription.", CalendarClock],
          ["Review-first import", "Approve the category before it touches your budget.", ClipboardCheck]
        ] satisfies Array<[string, string, LucideIcon]>).map(([title, body, Icon]) => (
          <MotionCard key={String(title)} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgb(31_209_165_/_0.10)] text-[var(--marketing-accent)]">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--marketing-text)]">{title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
              </div>
            </div>
          </MotionCard>
        ))}
      </div>
    </SplitSection>
  );
}

function FeatureGridSection() {
  return (
    <SectionShell eyebrow="Product surfaces" title="Adaptive intelligence across the budgeting workflow.">
      <FeatureGrid />
    </SectionShell>
  );
}

function MobilePreview() {
  return (
    <SectionShell eyebrow="Mobile-first design" title="A premium product surface for quick daily checks.">
      <MockupStrip />
    </SectionShell>
  );
}

function VisionPreview() {
  return (
    <StatementBand title="Future adaptive onboarding" body="Connect accounts, spend normally for a period, and let SpendFence propose realistic initial fences based on actual rhythm. No rigid setup. No financial shame." />
  );
}

function AnimatedDashboardMockup() {
  return (
    <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-[43rem]">
      <motion.div
        className="absolute -inset-4 rounded-[2.75rem] bg-[linear-gradient(135deg,rgb(31_209_165_/_0.26),rgb(75_140_255_/_0.10),transparent)] blur-2xl"
        animate={{ opacity: [0.5, 0.88, 0.5], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative rounded-[2.1rem] border border-[var(--marketing-border)] bg-[var(--marketing-device)] p-3 shadow-[0_34px_90px_rgb(0_0_0_/_0.30)] backdrop-blur-xl sm:rounded-[2.75rem] sm:p-4"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="overflow-hidden rounded-[1.65rem] border border-[var(--marketing-border)] bg-[var(--marketing-panel)] p-4 sm:rounded-[2.15rem] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">SpendFence Live</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--marketing-text)]">Adaptive dashboard</h2>
            </div>
            <span className="rounded-full border border-[rgb(31_209_165_/_0.22)] bg-[rgb(31_209_165_/_0.10)] px-3 py-1 text-xs font-black text-[var(--marketing-accent)]">Demo ready</span>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ["Dining", 83, "#F5B942", "$302 of $360"],
              ["Groceries", 58, "#1FD1A5", "$418 of $720"],
              ["Subscriptions", 42, "#5EA1FF", "$51 of $120"]
            ].map(([name, percent, color, caption]) => (
              <div key={name} className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-[var(--marketing-text)]">{name}</span>
                  <span className="text-xs font-black text-[var(--marketing-muted)]">{caption}</span>
                </div>
                <ProgressBar percent={Number(percent)} color={String(color)} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniMetric label="Available" value="$3,820" />
            <MiniMetric label="Insights" value="4 active" />
          </div>
        </div>
        <FloatingInsight />
        <FloatingApproval />
      </motion.div>
    </motion.div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--marketing-muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--marketing-text)]">{value}</p>
    </div>
  );
}

function FloatingInsight() {
  return (
    <motion.div
      className="absolute -right-1 top-20 w-[min(17rem,78vw)] rounded-3xl border border-[rgb(31_209_165_/_0.22)] bg-[var(--marketing-float)] p-4 shadow-[0_24px_70px_rgb(0_0_0_/_0.26)] backdrop-blur-xl sm:-right-8"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgb(31_209_165_/_0.12)] text-[var(--marketing-accent)]">
          <Brain size={19} />
        </div>
        <div>
          <p className="text-sm font-black text-[var(--marketing-text)]">Smart insight</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">Dining is moving faster than your usual cycle pace.</p>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingApproval() {
  return (
    <motion.div
      className="absolute -bottom-5 left-4 w-[min(18rem,78vw)] rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-approval)] p-4 text-[var(--marketing-approval-text)] shadow-[0_24px_70px_rgb(0_0_0_/_0.24)] sm:-bottom-8 sm:left-10"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#327D6D]">Suggested fence</p>
          <p className="mt-1 text-lg font-black">Dining: $390</p>
        </div>
        <span className="rounded-full bg-[#E4F8F0] px-3 py-1 text-xs font-black text-[#327D6D]">Approve</span>
      </div>
    </motion.div>
  );
}

function FeatureGrid() {
  return (
    <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {featureCards.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <MotionCard className="transition hover:-translate-y-1 hover:border-[rgb(31_209_165_/_0.28)] hover:bg-[var(--marketing-panel-strong)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(31_209_165_/_0.10)] text-[var(--marketing-accent)]">
        <Icon size={21} />
      </div>
      <h3 className="mt-5 text-lg font-black leading-6 text-[var(--marketing-text)]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
    </MotionCard>
  );
}

function MockupStrip() {
  const screens = [
    { title: "Dashboard", icon: BarChart3, preview: <DashboardPreview /> },
    { title: "Budgets", icon: WalletCards, preview: <BudgetsPreview /> },
    { title: "Reports", icon: ReceiptText, preview: <ReportsPreview /> },
    { title: "Pacing", icon: TrendingUp, preview: <PacingPreview /> }
  ];

  return (
    <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {screens.map((screen) => {
        const Icon = screen.icon;
        return (
          <MotionCard key={screen.title} className="group relative overflow-hidden p-4 transition hover:border-[rgb(99_102_241_/_0.28)] hover:shadow-[0_26px_80px_rgb(79_70_229_/_0.14)]">
            <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[rgb(99_102_241_/_0.14)] blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative rounded-[1.35rem] border border-[var(--marketing-border)] bg-[var(--marketing-device)] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full border border-[rgb(99_102_241_/_0.18)] bg-[rgb(99_102_241_/_0.10)] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#8EA2FF]">
                  Live view
                </span>
                <Icon size={18} className="text-[var(--marketing-accent)]" />
              </div>
              {screen.preview}
            </div>
            <h3 className="relative mt-4 text-lg font-black text-[var(--marketing-text)]">{screen.title}</h3>
          </MotionCard>
        );
      })}
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <div>
      <p className="text-3xl font-black tracking-tight text-[var(--marketing-text)]">$3,820</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--marketing-muted)]">available this cycle</p>
      <div className="mt-4 grid gap-2.5">
        <PreviewProgress label="Groceries" note="inside fence" value="$418 / $720" percent={58} color="#6366F1" />
        <PreviewProgress label="Dining" note="pacing high" value="$302 / $360" percent={84} color="#F5B942" />
      </div>
      <AiChip className="mt-3">AI: Dining is 18% faster than rhythm</AiChip>
    </div>
  );
}

function BudgetsPreview() {
  return (
    <div className="grid gap-2.5">
      <PreviewCategory name="Groceries" meta="$412 left" status="Safe" percent={58} color="#6366F1" />
      <PreviewCategory name="Dining" meta="78% used" status="Watch" percent={78} color="#F5B942" />
      <PreviewCategory name="Fuel" meta="$96 left" status="Safe" percent={44} color="#5EA1FF" />
    </div>
  );
}

function ReportsPreview() {
  return (
    <div>
      <AiChip>Smart insight ready</AiChip>
      <p className="mt-3 text-sm font-black leading-5 text-[var(--marketing-text)]">Weekend dining is driving most variance.</p>
      <MiniBars values={[34, 48, 42, 64, 58, 72, 61]} />
      <p className="mt-3 rounded-2xl border border-[rgb(99_102_241_/_0.16)] bg-[rgb(99_102_241_/_0.08)] px-3 py-2 text-xs font-bold leading-5 text-[var(--marketing-muted)]">
        Adaptive insight: keep Dining fence stable, watch Friday pacing.
      </p>
    </div>
  );
}

function PacingPreview() {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-black tracking-tight text-[var(--marketing-text)]">18%</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--marketing-muted)]">ahead of rhythm</p>
        </div>
        <span className="rounded-full border border-amber-200/50 bg-amber-400/10 px-2.5 py-1 text-[0.65rem] font-black text-amber-500">Watch</span>
      </div>
      <MiniLine />
      <div className="mt-3 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--marketing-muted)]">Projected cycle spend</p>
        <p className="mt-1 text-lg font-black text-[var(--marketing-text)]">$4,240</p>
      </div>
    </div>
  );
}

function PreviewProgress({ label, note, value, percent, color }: { label: string; note: string; value: string; percent: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-[var(--marketing-text)]">{label}</p>
          <p className="text-[0.65rem] font-bold text-[var(--marketing-muted)]">{note}</p>
        </div>
        <span className="shrink-0 text-[0.65rem] font-black text-[var(--marketing-muted)]">{value}</span>
      </div>
      <ProgressBar percent={percent} color={color} compact />
    </div>
  );
}

function PreviewCategory({ name, meta, status, percent, color }: { name: string; meta: string; status: string; percent: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black text-[var(--marketing-text)]">{name}</p>
          <p className="text-[0.65rem] font-bold text-[var(--marketing-muted)]">{meta}</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-black", status === "Watch" ? "bg-amber-400/12 text-amber-500" : "bg-[rgb(99_102_241_/_0.10)] text-[#8EA2FF]")}>{status}</span>
      </div>
      <ProgressBar percent={percent} color={color} compact />
    </div>
  );
}

function AiChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-[rgb(99_102_241_/_0.20)] bg-[rgb(99_102_241_/_0.10)] px-2.5 py-1 text-[0.68rem] font-black text-[#A5B4FC]", className)}>
      <Sparkles size={12} /> {children}
    </span>
  );
}

function MiniBars({ values }: { values: number[] }) {
  return (
    <div className="mt-4 flex h-16 items-end gap-1.5 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-3">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="flex-1 rounded-full bg-[linear-gradient(180deg,#A5B4FC,#6366F1)] opacity-90" style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}

function MiniLine() {
  return (
    <div className="mt-4 h-20 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-2">
      <svg viewBox="0 0 180 64" className="h-full w-full overflow-visible" aria-hidden="true">
        <path d="M4 48 C28 38, 42 42, 62 30 S100 20, 124 28 S154 46, 176 18" fill="none" stroke="rgb(165 180 252 / 0.28)" strokeWidth="10" strokeLinecap="round" />
        <path d="M4 48 C28 38, 42 42, 62 30 S100 20, 124 28 S154 46, 176 18" fill="none" stroke="rgb(99 102 241)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PricingComparison() {
  const rows = [
    ["Manual fences", "Included", "Included"],
    ["Manual purchases", "Included", "Included"],
    ["Receipt scanning", "Included", "Included"],
    ["Teller-linked accounts", "2 accounts", "Unlimited"],
    ["Intelligence label", "Basic Intelligence", "Advanced Intelligence"],
    ["Pattern recognition", "Basic", "Advanced"],
    ["Adaptive recommendations", "Limited", "Included"],
    ["Future predictive budgeting", "-", "Included"]
  ];

  return (
    <MotionCard className="mt-5 overflow-hidden p-0">
      <div className="grid grid-cols-[1.1fr_0.8fr_0.9fr] border-b border-[var(--marketing-border)] bg-[var(--marketing-panel)] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--marketing-muted)]">
        <span>Feature</span>
        <span>Free</span>
        <span>Premium</span>
      </div>
      {rows.map(([feature, free, premium], index) => (
        <div key={feature} className={cn("grid grid-cols-[1.1fr_0.8fr_0.9fr] gap-2 px-4 py-3 text-sm font-bold", index % 2 === 0 ? "bg-[var(--marketing-card)]" : "bg-[var(--marketing-panel)]")}>
          <span className="font-black text-[var(--marketing-text)]">{feature}</span>
          <span className="text-[var(--marketing-muted)]">{free}</span>
          <span className="font-black text-[#A5B4FC]">{premium}</span>
        </div>
      ))}
    </MotionCard>
  );
}

function PricingCard({ title, price, cadence, body, features, href, onClick, cta, badge, highlighted = false, disabled = false }: { title: string; price: string; cadence?: string; body: string; features: string[]; href?: string; onClick?: () => void; cta: string; badge?: string; highlighted?: boolean; disabled?: boolean }) {
  const ctaClassName = cn("relative mt-7 w-full", highlighted && "bg-[linear-gradient(135deg,#1E1B4B,#4F46E5_52%,#7C3AED)] shadow-[0_18px_44px_rgb(79_70_229_/_0.22)] text-white");

  return (
    <MotionCard className={cn("relative overflow-hidden p-6 transition hover:shadow-[0_28px_90px_rgb(79_70_229_/_0.14)]", highlighted && "border-[rgb(99_102_241_/_0.28)] bg-[radial-gradient(circle_at_12%_0%,rgb(99_102_241_/_0.13),transparent_16rem),var(--marketing-card)]")}>
      {highlighted ? <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[rgb(99_102_241_/_0.16)] blur-3xl" /> : null}
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">{title}</p>
          <h2 className="mt-3 text-4xl font-black text-[var(--marketing-text)]">
            {price}
            {cadence ? <span className="ml-1 text-sm font-black text-[var(--marketing-muted)]">{cadence}</span> : null}
          </h2>
        </div>
        {badge ? <span className="relative rounded-full border border-[rgb(99_102_241_/_0.22)] bg-[rgb(99_102_241_/_0.10)] px-3 py-1 text-xs font-black text-[#A5B4FC]">{badge}</span> : highlighted ? <span className="relative rounded-full border border-[rgb(99_102_241_/_0.22)] bg-[rgb(99_102_241_/_0.10)] px-3 py-1 text-xs font-black text-[#A5B4FC]">Premium</span> : null}
      </div>
      <p className="relative mt-4 text-sm font-semibold leading-6 text-[var(--marketing-muted)]">{body}</p>
      <div className="relative mt-6 grid gap-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm font-black text-[var(--marketing-text)]">
            <CheckCircle2 size={17} className={highlighted ? "text-[#A5B4FC]" : "text-[var(--marketing-accent)]"} /> {feature}
          </div>
        ))}
      </div>
      {onClick ? (
        <button type="button" onClick={onClick} disabled={disabled} className={cn(primaryCtaClassName, ctaClassName, disabled && "cursor-not-allowed opacity-70 hover:translate-y-0")}>
          {cta} <ArrowRight size={18} />
        </button>
      ) : href ? (
        <PrimaryCta href={href} className={ctaClassName}>{cta}</PrimaryCta>
      ) : null}
    </MotionCard>
  );
}

function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div variants={fadeUp} className="max-w-4xl">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-[-0.035em] text-[var(--marketing-text)] sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[var(--marketing-muted)] sm:text-lg">{body}</p>
      </motion.div>
    </section>
  );
}

function SectionShell({ eyebrow, title, children }: { eyebrow?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      {title ? (
        <motion.div variants={fadeUp} className="mb-8 max-w-4xl">
          {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">{eyebrow}</p> : null}
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.035em] text-[var(--marketing-text)] sm:text-5xl">{title}</h2>
        </motion.div>
      ) : null}
      {children}
    </section>
  );
}

function SplitSection({ eyebrow, title, body, ctaHref, ctaLabel, reverse = false, children }: { eyebrow: string; title: string; body: string; ctaHref: string; ctaLabel: string; reverse?: boolean; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className={cn("grid gap-8 lg:grid-cols-2 lg:items-center", reverse && "lg:[&>*:first-child]:order-2")}>
        <motion.div variants={fadeUp}>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">{eyebrow}</p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.035em] text-[var(--marketing-text)] sm:text-5xl">{title}</h2>
          <p className="mt-5 text-base font-semibold leading-8 text-[var(--marketing-muted)]">{body}</p>
          <SecondaryCta href={ctaHref} className="mt-6">{ctaLabel}</SecondaryCta>
        </motion.div>
        <motion.div variants={fadeUp}>{children}</motion.div>
      </div>
    </section>
  );
}

function StatementBand({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-[rgb(31_209_165_/_0.20)] bg-[linear-gradient(135deg,rgb(31_209_165_/_0.13),var(--marketing-panel))] p-6 shadow-[var(--marketing-shadow)] sm:p-8 lg:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgb(31_209_165_/_0.14)] blur-3xl" />
        <div className="relative">
          <h2 className="max-w-4xl text-3xl font-black leading-tight tracking-[-0.035em] text-[var(--marketing-text)] sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--marketing-muted)]">{body}</p>
        </div>
      </motion.div>
    </section>
  );
}

function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("rounded-[1.5rem] border border-[var(--marketing-border)] bg-[var(--marketing-card)] p-5 shadow-[var(--marketing-card-shadow)] backdrop-blur", className)}
    >
      {children}
    </motion.article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-pill)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] backdrop-blur">
      <ShieldCheck size={14} /> {children}
    </span>
  );
}

function PrimaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(primaryCtaClassName, className)}>
      {children} <ArrowRight size={18} />
    </Link>
  );
}

const primaryCtaClassName =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--marketing-primary-button)] px-6 text-sm font-black text-[var(--marketing-primary-button-text)] shadow-[0_18px_44px_rgb(31_209_165_/_0.20)] transition hover:-translate-y-1 hover:brightness-105 active:translate-y-0";

function SecondaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-pill)] px-6 text-sm font-black text-[var(--marketing-accent)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] transition hover:-translate-y-1 hover:bg-[var(--marketing-pill-strong)] active:translate-y-0", className)}>
      {children} <ChevronRight size={18} />
    </Link>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 py-16 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6 lg:px-8 lg:py-24">
      <motion.div variants={fadeUp} className="mx-auto max-w-5xl rounded-[2rem] border border-[rgb(31_209_165_/_0.20)] bg-[linear-gradient(135deg,rgb(31_209_165_/_0.14),var(--marketing-panel))] p-6 shadow-[var(--marketing-shadow)] backdrop-blur sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--marketing-accent)]">SpendFence</p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.035em] text-[var(--marketing-text)] sm:text-5xl">Build fences that fit your life.</h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[var(--marketing-muted)]">
              Adaptive budgeting powered by AI-assisted financial pacing and behavioral spending intelligence.
            </p>
          </div>
          <div className="grid gap-3 sm:flex lg:shrink-0">
            <PrimaryCta href="/premium">Start Premium</PrimaryCta>
            <SecondaryCta href="/demo">Try Demo</SecondaryCta>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

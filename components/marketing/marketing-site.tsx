"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  WalletCards
} from "lucide-react";
import { ProgressBar } from "@/components/ui";
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
    title: "Recurring Charges",
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

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#071012] text-[#F4F7F6]">
      <div className="landing-bg pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgb(31_209_165_/_0.16),transparent_34rem)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071012]/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img src="/brand/spendfence-logo-dark.png" alt="SpendFence" className="h-10 w-auto shrink-0 object-contain" />
            <span className="truncate text-lg font-black tracking-tight text-white">SpendFence</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || page === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-black transition",
                    active ? "text-[#0B1114]" : "text-white/62 hover:text-white"
                  )}
                >
                  {active ? <motion.span layoutId="marketing-nav-pill" className="absolute inset-0 rounded-full bg-[#EAFBF5]" transition={{ duration: 0.28 }} /> : null}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-[#1FD1A5]/24 bg-[#1FD1A5]/10 px-4 text-sm font-black text-[#7EF2D4] shadow-[0_18px_44px_rgb(31_209_165_/_0.12)] transition hover:-translate-y-0.5 hover:bg-[#1FD1A5]/14"
          >
            Open App
          </Link>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-3 text-sm font-black text-white/62 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5",
                pathname === item.href ? "border-[#1FD1A5]/30 bg-[#1FD1A5]/12 text-[#7EF2D4]" : "border-white/10 bg-white/[0.04]"
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
      <ProblemSnapshot />
      <PhilosophyPreview />
      <AiPreview />
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
              <h2 className="text-2xl font-black leading-tight text-white">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#A7B3BC]">{body}</p>
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
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <AnimatedDashboardMockup />
          <motion.div variants={stagger} className="grid gap-3">
            {steps.map(([title, body], index) => (
              <MotionCard key={title} className="p-4">
                <div className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#1FD1A5]/12 text-sm font-black text-[#7EF2D4]">{index + 1}</span>
                  <div>
                    <h2 className="font-black text-white">{title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#A7B3BC]">{body}</p>
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
      <SectionShell>
        <FeatureGrid />
      </SectionShell>
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
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1FD1A5]/10 text-[#7EF2D4]">
                <LockKeyhole size={20} />
              </div>
              <h2 className="mt-5 text-xl font-black text-white">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#A7B3BC]">{body}</p>
            </MotionCard>
          ))}
        </motion.div>
      </SectionShell>
    </MarketingShell>
  );
}

export function PricingMarketingPage() {
  return (
    <MarketingShell page="pricing">
      <PageHero
        eyebrow="Pricing"
        title="Start with adaptive budgeting. Upgrade when deeper intelligence arrives."
        body="SpendFence keeps the core workflow approachable while making room for advanced behavioral intelligence and future account-linked learning."
      />
      <SectionShell>
        <div className="grid gap-5 lg:grid-cols-2">
          <PricingCard
            title="Free"
            price="$0"
            body="For manual budgeting with basic intelligence and adaptive guidance."
            cta="Try SpendFence"
            href="/signup"
            features={["Manual budgeting", "Basic intelligence", "Receipt scanning", "Adaptive suggestions", "Spending rules"]}
          />
          <PricingCard
            title="Premium"
            price="Planned"
            body="For deeper pattern recognition and advanced adaptive onboarding."
            cta="Open App"
            href="/dashboard"
            highlighted
            features={["Advanced intelligence", "Adaptive onboarding", "Advanced pattern recognition", "Predictive pacing", "Deeper behavioral insights", "Future account-linked AI learning"]}
          />
        </div>
      </SectionShell>
    </MarketingShell>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_16_18_/_0.12),#071012_92%)]" />
      <div className="relative mx-auto grid min-h-[88svh] max-w-7xl gap-10 px-5 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:py-20">
        <motion.div variants={fadeUp} className="max-w-3xl">
          <Badge>Adaptive AI-assisted spending intelligence</Badge>
          <h1 className="mt-6 text-5xl font-black leading-[1.01] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Budgeting that adapts to how you actually live.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-[#A7B3BC] sm:text-lg">
            SpendFence uses adaptive AI-assisted insights to help users create realistic spending fences from real behavior — not fantasy budgets.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCta href="/signup">Try SpendFence</PrimaryCta>
            <SecondaryCta href="/login">View Demo</SecondaryCta>
          </div>
        </motion.div>
        <AnimatedDashboardMockup />
      </div>
    </section>
  );
}

function ProblemSnapshot() {
  return (
    <SectionShell eyebrow="Budgeting fatigue" title="Most budgets fail before they learn anything.">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.p variants={fadeUp} className="text-lg font-semibold leading-8 text-[#A7B3BC]">
          Most budgeting apps ask users to guess perfect limits upfront. Then real life arrives, categories drift, and the app quietly becomes another source of pressure.
        </motion.p>
        <MotionCard>
          <p className="text-2xl font-black leading-tight text-white">SpendFence starts from behavior.</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#A7B3BC]">
            It helps users watch pacing, understand pressure, and build more realistic spending fences over time.
          </p>
        </MotionCard>
      </div>
    </SectionShell>
  );
}

function PhilosophyPreview() {
  return (
    <SplitSection
      eyebrow="Adaptive philosophy"
      title="Spending boundaries, not spending punishment."
      body="SpendFence treats budgeting as a feedback loop: observe the rhythm, name the pattern, then adjust the boundary when it makes sense."
      ctaHref="/philosophy"
      ctaLabel="Read the philosophy"
    >
      <div className="grid gap-3">
        {["Behavioral finance", "Realistic budgeting", "Adaptive pacing"].map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-black text-white">
            {item}
          </div>
        ))}
      </div>
    </SplitSection>
  );
}

function AiPreview() {
  return (
    <SplitSection
      eyebrow="AI-assisted insights"
      title="Intelligence that supports decisions without taking them over."
      body="Receipt analysis, category suggestions, smart insights, and adaptive fence recommendations work together to make budgeting feel clearer and less brittle."
      ctaHref="/adaptive-ai"
      ctaLabel="Explore Adaptive AI"
      reverse
    >
      <div className="grid gap-3">
        {["AI suggests", "User approves", "Fences adapt"].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#1FD1A5]/16 bg-[#1FD1A5]/[0.055] p-4 text-sm font-black text-[#EAFBF5]">
            <CheckCircle2 size={18} className="text-[#7EF2D4]" /> {item}
          </div>
        ))}
      </div>
    </SplitSection>
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
    <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-[42rem]">
      <motion.div
        className="absolute -inset-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgb(31_209_165_/_0.24),rgb(75_140_255_/_0.08),transparent)] blur-2xl"
        animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative rounded-[2rem] border border-white/10 bg-[#0B1114]/88 p-3 shadow-[0_34px_90px_rgb(0_0_0_/_0.42)] backdrop-blur-xl sm:rounded-[2.5rem] sm:p-4"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="rounded-[1.5rem] border border-white/10 bg-[#121A1F] p-4 sm:rounded-[2rem] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1FD1A5]">Dashboard</p>
              <h2 className="mt-1 text-2xl font-black text-white">Fence rhythm</h2>
            </div>
            <span className="rounded-full border border-[#1FD1A5]/20 bg-[#1FD1A5]/10 px-3 py-1 text-xs font-black text-[#7EF2D4]">Live cycle</span>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ["Dining", 83, "#F5B942", "$302 of $360"],
              ["Groceries", 58, "#1FD1A5", "$418 of $720"],
              ["Subscriptions", 42, "#5EA1FF", "$51 of $120"]
            ].map(([name, percent, color, caption]) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-white">{name}</span>
                  <span className="text-xs font-black text-[#A7B3BC]">{caption}</span>
                </div>
                <ProgressBar percent={Number(percent)} color={String(color)} />
              </div>
            ))}
          </div>
        </div>
        <FloatingInsight />
        <FloatingApproval />
      </motion.div>
    </motion.div>
  );
}

function FloatingInsight() {
  return (
    <motion.div
      className="absolute -right-1 top-20 w-[min(17rem,78vw)] rounded-3xl border border-[#1FD1A5]/20 bg-[#0F1B1E]/94 p-4 shadow-[0_24px_70px_rgb(0_0_0_/_0.38)] backdrop-blur sm:-right-8"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#1FD1A5]/12 text-[#7EF2D4]">
          <Brain size={19} />
        </div>
        <div>
          <p className="text-sm font-black text-white">Smart insight</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#A7B3BC]">Dining is moving faster than your usual cycle pace.</p>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingApproval() {
  return (
    <motion.div
      className="absolute -bottom-5 left-4 w-[min(18rem,78vw)] rounded-3xl border border-white/10 bg-[#F4F7F6] p-4 text-[#0B1114] shadow-[0_24px_70px_rgb(0_0_0_/_0.34)] sm:-bottom-8 sm:left-10"
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
    <MotionCard className="transition hover:-translate-y-1 hover:border-[#1FD1A5]/28 hover:bg-[#121F23]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1FD1A5]/10 text-[#7EF2D4]">
        <Icon size={21} />
      </div>
      <h3 className="mt-5 text-lg font-black leading-6 text-white">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#A7B3BC]">{body}</p>
    </MotionCard>
  );
}

function MockupStrip() {
  const screens = [
    { title: "Dashboard", metric: "$3,820", label: "available", icon: BarChart3 },
    { title: "Budgets", metric: "6 fences", label: "tracking", icon: WalletCards },
    { title: "Reports", metric: "4 insights", label: "this cycle", icon: ReceiptText },
    { title: "Add Purchase", metric: "18 sec", label: "quick entry", icon: Camera }
  ];

  return (
    <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {screens.map((screen) => {
        const Icon = screen.icon;
        return (
          <MotionCard key={screen.title} className="p-4">
            <div className="rounded-[1.35rem] border border-white/10 bg-[#0B1114] p-4">
              <div className="mb-5 flex items-center justify-between">
                <span className="h-2 w-16 rounded-full bg-white/12" />
                <Icon size={18} className="text-[#7EF2D4]" />
              </div>
              <p className="text-3xl font-black tracking-tight text-white">{screen.metric}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#6F7D87]">{screen.label}</p>
              <div className="mt-5 grid gap-2">
                <span className="h-10 rounded-xl bg-white/[0.055]" />
                <span className="h-10 rounded-xl bg-white/[0.04]" />
                <span className="h-10 rounded-xl bg-white/[0.03]" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-black text-white">{screen.title}</h3>
          </MotionCard>
        );
      })}
    </motion.div>
  );
}

function PricingCard({ title, price, body, features, href, cta, highlighted = false }: { title: string; price: string; body: string; features: string[]; href: string; cta: string; highlighted?: boolean }) {
  return (
    <MotionCard className={cn("p-6", highlighted && "border-[#1FD1A5]/28 bg-[#1FD1A5]/[0.055]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7EF2D4]">{title}</p>
          <h2 className="mt-3 text-4xl font-black text-white">{price}</h2>
        </div>
        {highlighted ? <span className="rounded-full border border-[#1FD1A5]/20 bg-[#1FD1A5]/10 px-3 py-1 text-xs font-black text-[#7EF2D4]">Future</span> : null}
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-[#A7B3BC]">{body}</p>
      <div className="mt-6 grid gap-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm font-black text-[#EAFBF5]">
            <CheckCircle2 size={17} className="text-[#7EF2D4]" /> {feature}
          </div>
        ))}
      </div>
      <PrimaryCta href={href} className="mt-7 w-full">{cta}</PrimaryCta>
    </MotionCard>
  );
}

function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div variants={fadeUp} className="max-w-4xl">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[#A7B3BC] sm:text-lg">{body}</p>
      </motion.div>
    </section>
  );
}

function SectionShell({ eyebrow, title, children }: { eyebrow?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      {title ? (
        <motion.div variants={fadeUp} className="mb-8 max-w-4xl">
          {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7EF2D4]">{eyebrow}</p> : null}
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">{title}</h2>
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
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7EF2D4]">{eyebrow}</p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">{title}</h2>
          <p className="mt-5 text-base font-semibold leading-8 text-[#A7B3BC]">{body}</p>
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
      <motion.div variants={fadeUp} className="rounded-[2rem] border border-[#1FD1A5]/20 bg-[linear-gradient(135deg,rgb(31_209_165_/_0.14),rgb(255_255_255_/_0.045))] p-6 shadow-[0_34px_90px_rgb(0_0_0_/_0.28)] sm:p-8 lg:p-10">
        <h2 className="max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">{title}</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[#A7B3BC]">{body}</p>
      </motion.div>
    </section>
  );
}

function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("rounded-[1.5rem] border border-white/10 bg-[#101A1E] p-5 shadow-[0_18px_54px_rgb(0_0_0_/_0.18)]", className)}
    >
      {children}
    </motion.article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#7EF2D4] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] backdrop-blur">
      <ShieldCheck size={14} /> {children}
    </span>
  );
}

function PrimaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#0B1114] shadow-[0_18px_44px_rgb(31_209_165_/_0.2)] transition hover:-translate-y-1 hover:bg-[#EAFBF5]", className)}>
      {children} <ArrowRight size={18} />
    </Link>
  );
}

function SecondaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 text-sm font-black text-[#7EF2D4] transition hover:-translate-y-1 hover:bg-white/[0.1]", className)}>
      {children} <ChevronRight size={18} />
    </Link>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 py-16 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6 lg:px-8 lg:py-24">
      <motion.div variants={fadeUp} className="mx-auto max-w-5xl rounded-[2rem] border border-[#1FD1A5]/20 bg-[linear-gradient(135deg,rgb(31_209_165_/_0.14),rgb(255_255_255_/_0.045))] p-6 shadow-[0_34px_90px_rgb(0_0_0_/_0.32)] backdrop-blur sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7EF2D4]">SpendFence</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">Build fences that fit your life.</h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[#A7B3BC]">
              Adaptive budgeting powered by AI-assisted financial pacing and behavioral spending intelligence.
            </p>
          </div>
          <PrimaryCta href="/signup" className="shrink-0">Try SpendFence</PrimaryCta>
        </div>
      </motion.div>
    </section>
  );
}

function AiPreviewList() {
  return (
    <div className="grid gap-3">
      {["Receipt analysis", "Category suggestions", "Adaptive recommendations"].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-black text-white">
          <Eye size={18} className="text-[#7EF2D4]" /> {item}
        </div>
      ))}
    </div>
  );
}

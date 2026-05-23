"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Plus, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { CategoryIcon } from "@/components/category-icons";
import { Button, Card, Field, Input, Pill, Select } from "@/components/ui";
import { currentCycleWindow, formatMoney, normalizeCycleStartDay } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { CategoryInput, InsightSettings, OnboardingProfile } from "@/lib/types";

const draftKey = "spendfence-onboarding-draft-v1";

const starterCategories = [
  { id: "groceries", name: "Groceries", icon: "basket", color: "#58c6a8", percent: 0.12 },
  { id: "dining", name: "Dining", icon: "utensils", color: "#f59e6b", percent: 0.06 },
  { id: "gas", name: "Gas", icon: "fuel", color: "#5b8def", percent: 0.05 },
  { id: "shopping", name: "Shopping", icon: "tag", color: "#a78bfa", percent: 0.06 },
  { id: "bills", name: "Bills", icon: "receipt", color: "#64748b", percent: 0.28 },
  { id: "entertainment", name: "Entertainment", icon: "sparkles", color: "#f472b6", percent: 0.04 },
  { id: "health", name: "Health", icon: "heart", color: "#22c55e", percent: 0.05 },
  { id: "family", name: "Kids/Family", icon: "heart", color: "#38bdf8", percent: 0.07 },
  { id: "travel", name: "Travel", icon: "home", color: "#14b8a6", percent: 0.04 },
  { id: "savings", name: "Savings", icon: "repeat", color: "#84cc16", percent: 0.1 }
] as const;

const defaultSelected = ["groceries", "dining", "gas", "bills", "shopping"];
const steps = ["Welcome", "Rhythm", "Income", "Categories", "Fences", "Insights", "Preview", "Complete"];

type Draft = {
  rhythm: OnboardingProfile["rhythm"];
  cycleDay: number;
  incomeAmount: string;
  incomeFrequency: OnboardingProfile["incomeFrequency"];
  selectedIds: string[];
  customName: string;
  customCategories: string[];
  guardrailMode: OnboardingProfile["guardrailMode"];
  limits: Record<string, string>;
  insightLevel: InsightSettings["detailLevel"];
  dashboardInsights: boolean;
  reportInsights: boolean;
  recurringDetection: boolean;
  trendSummaries: boolean;
};

const initialDraft: Draft = {
  rhythm: "month-start",
  cycleDay: 1,
  incomeAmount: "",
  incomeFrequency: "monthly",
  selectedIds: defaultSelected,
  customName: "",
  customCategories: [],
  guardrailMode: "balanced",
  limits: {},
  insightLevel: "balanced",
  dashboardInsights: true,
  reportInsights: true,
  recurringDetection: true,
  trendSummaries: true
};

export default function OnboardingPage() {
  const router = useRouter();
  const state = useSpendFence();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const monthlyIncome = useMemo(() => normalizeIncome(draft.incomeAmount, draft.incomeFrequency), [draft.incomeAmount, draft.incomeFrequency]);
  const selectedStarter = starterCategories.filter((category) => draft.selectedIds.includes(category.id));
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) setDraft({ ...initialDraft, ...JSON.parse(saved) });
    } catch {
      setDraft(initialDraft);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft]);

  function next() {
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  function finish(skipped = false) {
    if (skipped) {
      state.skipOnboarding();
      window.localStorage.removeItem(draftKey);
      router.replace("/dashboard");
      return;
    }

    state.completeOnboarding({
      budgetCycleStartDay: normalizeCycleStartDay(draft.cycleDay),
      rhythm: draft.rhythm,
      income: monthlyIncome,
      incomeFrequency: draft.incomeFrequency,
      guardrailMode: draft.guardrailMode,
      categories: buildCategories(draft, monthlyIncome),
      insightSettings: buildInsightSettings(draft),
      selectedCategoryIds: draft.selectedIds,
      customCategoryNames: draft.customCategories
    });
    window.localStorage.removeItem(draftKey);
    router.replace("/dashboard");
  }

  function exploreDemo() {
    state.enableDemoData();
    window.localStorage.removeItem(draftKey);
    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col">
        <div className="sticky top-0 z-10 -mx-3 bg-[#f7faf7]/90 px-3 pb-3 pt-1 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-600 shadow-soft disabled:opacity-0"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">{steps[step]}</p>
            <button type="button" onClick={() => finish(true)} className="min-h-10 rounded-2xl px-3 text-xs font-black text-slate-500 hover:bg-white">
              Skip
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#183f36] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="flex flex-1 flex-col justify-center py-4"
        >
          {step === 0 ? <WelcomeStep onNext={next} onDemo={exploreDemo} /> : null}
          {step === 1 ? <RhythmStep draft={draft} setDraft={setDraft} onNext={next} /> : null}
          {step === 2 ? <IncomeStep draft={draft} setDraft={setDraft} monthlyIncome={monthlyIncome} onNext={next} /> : null}
          {step === 3 ? <CategoriesStep draft={draft} setDraft={setDraft} onNext={next} /> : null}
          {step === 4 ? <LimitsStep draft={draft} setDraft={setDraft} monthlyIncome={monthlyIncome} onNext={next} /> : null}
          {step === 5 ? <PreferencesStep draft={draft} setDraft={setDraft} onNext={next} /> : null}
          {step === 6 ? <PreviewStep draft={draft} monthlyIncome={monthlyIncome} onNext={next} /> : null}
          {step === 7 ? <CompleteStep onFinish={() => finish(false)} /> : null}
        </motion.div>
      </div>
    </main>
  );
}

function WelcomeStep({ onNext, onDemo }: { onNext: () => void; onDemo: () => void }) {
  return (
    <Card className="overflow-hidden border-white bg-white p-0">
      <div className="relative min-h-48 bg-[#183f36] p-5 text-white">
        <div className="absolute inset-x-6 bottom-5 grid grid-cols-3 gap-2 opacity-80">
          {[34, 58, 76].map((height, index) => (
            <div key={height} className="rounded-2xl bg-white/12 p-2">
              <div className="mb-2 h-2 rounded-full bg-white/20" />
              <div className="rounded-full bg-[#a8ead9]" style={{ height }} />
              <p className="mt-2 text-[0.62rem] font-black text-white/70">{["Safe", "Paced", "Aware"][index]}</p>
            </div>
          ))}
        </div>
        <Pill className="border-white/15 bg-white/10 text-white">60 to 120 seconds</Pill>
      </div>
      <div className="p-5">
        <h1 className="text-3xl font-black tracking-tight text-[#10201c]">Create calm financial guardrails.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          SpendFence helps you set gentle boundaries, see your budget rhythm, and start with a dashboard that feels manageable.
        </p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" onClick={onNext}>
            Get Started <ArrowRight size={18} />
          </Button>
          <Button size="lg" variant="secondary" onClick={onDemo}>
            Explore Demo Mode
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RhythmStep({ draft, setDraft, onNext }: StepProps) {
  const window = currentCycleWindow({ budgetCycleStartDay: normalizeCycleStartDay(draft.cycleDay) });
  return (
    <StepShell
      icon={CalendarDays}
      title="When does your budget reset?"
      body="Pick the rhythm that matches how money naturally moves for you."
      actionLabel="Continue"
      onNext={onNext}
    >
      <Segmented
        value={draft.rhythm}
        options={[
          ["month-start", "1st of month"],
          ["paycheck", "Paycheck cycle"],
          ["custom", "Custom date"]
        ]}
        onChange={(rhythm) => setDraft({ ...draft, rhythm: rhythm as Draft["rhythm"], cycleDay: rhythm === "month-start" ? 1 : draft.cycleDay })}
      />
      {draft.rhythm !== "month-start" ? (
        <Field label="Reset day">
          <Input
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            value={draft.cycleDay}
            onChange={(event) => setDraft({ ...draft, cycleDay: normalizeCycleStartDay(Number(event.target.value)) })}
          />
        </Field>
      ) : null}
      <div className="rounded-2xl bg-[#f7faf7] p-3 text-sm font-bold text-slate-600">
        Your cycle will run: <span className="font-black text-[#10201c]">{formatShort(window.start)} to {formatShort(window.end)}</span>
      </div>
    </StepShell>
  );
}

function IncomeStep({ draft, setDraft, monthlyIncome, onNext }: StepProps & { monthlyIncome: number }) {
  return (
    <StepShell
      icon={WalletCards}
      title="What's your income target?"
      body="An estimate is enough. This helps SpendFence suggest healthier fences."
      actionLabel="Continue"
      secondaryAction={<Button variant="ghost" onClick={onNext}>Skip for now</Button>}
      onNext={onNext}
    >
      <Field label="Income amount">
        <Input
          inputMode="decimal"
          value={draft.incomeAmount}
          onChange={(event) => setDraft({ ...draft, incomeAmount: event.target.value })}
          placeholder="0.00"
        />
      </Field>
      <Segmented
        value={draft.incomeFrequency}
        options={[
          ["monthly", "Monthly"],
          ["biweekly", "Biweekly"],
          ["weekly", "Weekly"]
        ]}
        onChange={(incomeFrequency) => setDraft({ ...draft, incomeFrequency: incomeFrequency as Draft["incomeFrequency"] })}
      />
      <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
        Monthly planning target: {formatMoney(monthlyIncome)}
      </div>
    </StepShell>
  );
}

function CategoriesStep({ draft, setDraft, onNext }: StepProps) {
  function toggle(id: string) {
    const selectedIds = draft.selectedIds.includes(id) ? draft.selectedIds.filter((item) => item !== id) : [...draft.selectedIds, id];
    setDraft({ ...draft, selectedIds });
  }

  function addCustom(event: FormEvent) {
    event.preventDefault();
    const name = draft.customName.trim();
    if (!name) return;
    setDraft({ ...draft, customName: "", customCategories: [...draft.customCategories, name] });
  }

  return (
    <StepShell icon={WalletCards} title="Choose your core fences" body="Tap the areas you want on your first dashboard. You can edit everything later." actionLabel="Continue" onNext={onNext}>
      <div className="grid grid-cols-2 gap-2">
        {starterCategories.map((category) => {
          const selected = draft.selectedIds.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              className={`flex min-h-14 items-center gap-2 rounded-2xl border p-2 text-left transition ${
                selected ? "border-[#58c6a8] bg-[#e9f3ee] shadow-soft" : "border-slate-200 bg-white"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: category.color }}>
                <CategoryIcon icon={category.icon} size={17} />
              </span>
              <span className="text-sm font-black text-[#10201c]">{category.name}</span>
            </button>
          );
        })}
      </div>
      <form onSubmit={addCustom} className="flex gap-2">
        <Input value={draft.customName} onChange={(event) => setDraft({ ...draft, customName: event.target.value })} placeholder="Custom category" />
        <Button type="submit" variant="secondary">
          <Plus size={17} />
        </Button>
      </form>
      {draft.customCategories.length ? (
        <div className="flex flex-wrap gap-1.5">
          {draft.customCategories.map((name) => (
            <Pill key={name} className="border-slate-200 bg-white text-slate-600">{name}</Pill>
          ))}
        </div>
      ) : null}
    </StepShell>
  );
}

function LimitsStep({ draft, setDraft, monthlyIncome, onNext }: StepProps & { monthlyIncome: number }) {
  const categories = buildCategoryDrafts(draft, monthlyIncome);
  return (
    <StepShell
      icon={ShieldCheck}
      title="How proactive should SpendFence be?"
      body="This sets the tone of your fences. Nothing here is permanent."
      actionLabel="Continue"
      secondaryAction={<Button variant="ghost" onClick={onNext}>Skip limits</Button>}
      onNext={onNext}
    >
      <Segmented
        value={draft.guardrailMode}
        options={[
          ["gentle", "Gentle"],
          ["balanced", "Balanced"],
          ["strict", "Strict"]
        ]}
        onChange={(guardrailMode) => setDraft({ ...draft, guardrailMode: guardrailMode as Draft["guardrailMode"] })}
      />
      <div className="grid gap-2">
        {categories.slice(0, 5).map((category) => (
          <div key={category.key} className="grid grid-cols-[1fr_7rem] items-center gap-2 rounded-2xl bg-[#f7faf7] p-2.5">
            <div>
              <p className="text-sm font-black text-[#10201c]">{category.name}</p>
              <p className="text-xs font-bold text-slate-500">{guardrailCopy(draft.guardrailMode)}</p>
            </div>
            <Input
              inputMode="decimal"
              value={draft.limits[category.key] ?? String(category.limit)}
              onChange={(event) => setDraft({ ...draft, limits: { ...draft.limits, [category.key]: event.target.value } })}
              className="text-right"
            />
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function PreferencesStep({ draft, setDraft, onNext }: StepProps) {
  return (
    <StepShell icon={Sparkles} title="What kind of insights feel useful?" body="Choose the amount of guidance that feels supportive, not noisy." actionLabel="Continue" onNext={onNext}>
      <Segmented
        value={draft.insightLevel}
        options={[
          ["minimal", "Minimal"],
          ["balanced", "Balanced"],
          ["detailed", "Detailed"]
        ]}
        onChange={(insightLevel) => setDraft({ ...draft, insightLevel: insightLevel as Draft["insightLevel"] })}
      />
      <div className="grid gap-2">
        {[
          ["dashboardInsights", "Dashboard insights"],
          ["reportInsights", "Reports insights"],
          ["recurringDetection", "Recurring spend detection"],
          ["trendSummaries", "Spending trend summaries"]
        ].map(([key, label]) => (
          <label key={key} className="flex min-h-12 items-center justify-between rounded-2xl bg-[#f7faf7] px-3 text-sm font-black text-[#10201c]">
            {label}
            <input
              type="checkbox"
              checked={Boolean(draft[key as keyof Draft])}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })}
              className="h-5 w-5 accent-[#183f36]"
            />
          </label>
        ))}
      </div>
    </StepShell>
  );
}

function PreviewStep({ draft, monthlyIncome, onNext }: Pick<StepProps, "draft" | "onNext"> & { monthlyIncome: number }) {
  const categories = buildCategoryDrafts(draft, monthlyIncome);
  const window = currentCycleWindow({ budgetCycleStartDay: normalizeCycleStartDay(draft.cycleDay) });
  return (
    <StepShell icon={CheckCircle2} title="Your first dashboard is ready" body="A calm starting point. Add real purchases when you are ready." actionLabel="Looks good" onNext={onNext}>
      <div className="rounded-[1.25rem] bg-[#183f36] p-4 text-white shadow-float">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Budget cycle</p>
        <p className="mt-1 text-lg font-black">{formatShort(window.start)} to {formatShort(window.end)}</p>
        <p className="mt-3 text-xs font-bold text-white/70">Income target {formatMoney(monthlyIncome)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.slice(0, 4).map((category, index) => (
          <div key={category.key} className="rounded-2xl bg-white p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-xl text-white" style={{ background: category.color }}>
                <CategoryIcon icon={category.icon} size={15} />
              </span>
              <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">{index === 1 ? "Watch" : "Ready"}</Pill>
            </div>
            <p className="truncate text-sm font-black text-[#10201c]">{category.name}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{formatMoney(category.limit)} fence</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-5 text-emerald-800">
        You are ready to start building steadier spending habits.
      </div>
    </StepShell>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <Card>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-[#183f36] text-white shadow-float">
        <CheckCircle2 size={25} />
      </div>
      <h1 className="mt-5 text-center text-3xl font-black tracking-tight text-[#10201c]">You can actually manage this.</h1>
      <p className="mx-auto mt-3 max-w-xs text-center text-sm font-semibold leading-6 text-slate-600">
        Your dashboard is personalized, your fences are set, and SpendFence will keep the next step small.
      </p>
      <Button size="lg" className="mt-6 w-full" onClick={onFinish}>
        Enter SpendFence <ArrowRight size={18} />
      </Button>
    </Card>
  );
}

type StepProps = {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  onNext: () => void;
};

function StepShell({
  icon: Icon,
  title,
  body,
  children,
  actionLabel,
  secondaryAction,
  onNext
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  children: React.ReactNode;
  actionLabel: string;
  secondaryAction?: React.ReactNode;
  onNext: () => void;
}) {
  return (
    <Card>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
        <Icon size={22} />
      </div>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-[#10201c]">{title}</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
      <div className="mt-5 grid gap-3">{children}</div>
      <div className="mt-6 grid gap-2">
        <Button size="lg" onClick={onNext}>
          {actionLabel} <ArrowRight size={18} />
        </Button>
        {secondaryAction}
      </div>
    </Card>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-[#f7faf7] p-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`min-h-11 rounded-xl px-2 text-xs font-black transition ${value === key ? "bg-white text-[#183f36] shadow-soft" : "text-slate-500"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function buildCategories(draft: Draft, monthlyIncome: number): CategoryInput[] {
  return buildCategoryDrafts(draft, monthlyIncome).map(({ key: _key, percent: _percent, ...category }) => category);
}

function buildCategoryDrafts(draft: Draft, monthlyIncome: number) {
  const selected = starterCategories
    .filter((category) => draft.selectedIds.includes(category.id))
    .map((category) => ({
      key: category.id,
      name: category.name,
      limit: parseMoney(draft.limits[category.id]) || suggestedLimit(monthlyIncome, category.percent),
      warningThreshold: thresholds(draft.guardrailMode).warning,
      hardStopThreshold: thresholds(draft.guardrailMode).hardStop,
      color: category.color,
      icon: category.icon,
      percent: category.percent
    }));

  const custom = draft.customCategories.map((name, index) => ({
    key: `custom-${index}-${name}`,
    name,
    limit: parseMoney(draft.limits[`custom-${index}-${name}`]) || suggestedLimit(monthlyIncome, 0.05),
    warningThreshold: thresholds(draft.guardrailMode).warning,
    hardStopThreshold: thresholds(draft.guardrailMode).hardStop,
    color: ["#14b8a6", "#8b5cf6", "#f97316"][index % 3],
    icon: "tag",
    percent: 0.05
  }));

  return [...selected, ...custom];
}

function buildInsightSettings(draft: Draft): InsightSettings {
  return {
    spendingInsights: draft.insightLevel !== "minimal" || draft.dashboardInsights || draft.reportInsights,
    encouragementTone: draft.insightLevel === "minimal" ? "minimal" : "balanced",
    showDashboardInsights: draft.dashboardInsights,
    showReportInsights: draft.reportInsights,
    recurringDetection: draft.recurringDetection,
    trendSummaries: draft.trendSummaries,
    detailLevel: draft.insightLevel
  };
}

function normalizeIncome(value: string, frequency: Draft["incomeFrequency"]) {
  const amount = parseMoney(value);
  if (frequency === "weekly") return Math.round((amount * 52) / 12);
  if (frequency === "biweekly") return Math.round((amount * 26) / 12);
  return amount;
}

function parseMoney(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function suggestedLimit(monthlyIncome: number, percent: number) {
  const base = monthlyIncome > 0 ? monthlyIncome * percent : 300;
  return Math.max(50, Math.round(base / 25) * 25);
}

function thresholds(mode: Draft["guardrailMode"]) {
  if (mode === "gentle") return { warning: 90, hardStop: 110 };
  if (mode === "strict") return { warning: 70, hardStop: 95 };
  return { warning: 80, hardStop: 100 };
}

function guardrailCopy(mode: Draft["guardrailMode"]) {
  if (mode === "gentle") return "Less interruption.";
  if (mode === "strict") return "Stay tightly inside limits.";
  return "Helpful awareness.";
}

function formatShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

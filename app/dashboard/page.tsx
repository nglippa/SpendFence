"use client";

import Link from "next/link";
import { AlertTriangle, Brain, CalendarClock, ChevronRight, LockKeyhole, Plus, ReceiptText, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { CategoryCard } from "@/components/category-card";
import { IntelligenceEmptyState, IntelligenceSection, intelligenceAccentRailClass, intelligenceCardSurfaceClass, intelligenceIconSurfaceClass } from "@/components/insights/intelligence-section";
import { SpendInsightCard } from "@/components/insights/spend-insight-card";
import { Button, Card, EmptyState, PageHeader, Pill, ProgressBar } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { availableBudget, categoryProgress, currentCycleLabel, formatMoney, getSmartPrompts, purchasesForCycle, remainingBudget, totalSpent } from "@/lib/budget";
import { selectDashboardInsight } from "@/lib/insights/behavioral-insights";
import { monthlyRecurringAmount, recurringFrequencyLabel, recurringKindLabel, upcomingRecurringItems } from "@/lib/recurring";
import { useSpendFence } from "@/lib/store";
import type { Prompt } from "@/lib/types";
import { cn, formatShortDate } from "@/lib/utils";

export default function DashboardPage() {
  const state = useSpendFence();
  const { isPro } = useAuth();
  const cyclePurchases = purchasesForCycle(state.purchases, state.budgetMonth);
  const spent = totalSpent(state.purchases, state.budgetMonth);
  const available = availableBudget(state);
  const remaining = remainingBudget(state);
  const prompts = getSmartPrompts(state);
  const dashboardInsight = selectDashboardInsight(state);
  const upcomingRecurring = upcomingRecurringItems(state.recurringItems, 45);
  const locked = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "locked").length;
  const warnings = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "warning").length;
  const safe = state.categories.filter((category) => categoryProgress(category, state.purchases, state.budgetMonth).status === "safe").length;
  const budgetPercent = available > 0 ? (spent / available) * 100 : 0;
  const budgetColor = budgetPercent >= 100 ? "#F05D5E" : budgetPercent >= 80 ? "#F5B942" : "#18B889";

  return (
    <>
      <PageHeader
        kicker="Dashboard"
        title="Budget cycle at a glance"
        body={`${currentCycleLabel(state.budgetMonth)}. Big numbers, clear fences, and quick warnings before spending drifts.`}
        action={
          <Button asChild>
            <Link href="/add-purchase">
              <Plus size={18} /> Add purchase
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
        <Card className="col-span-2 bg-brand-gradient text-white md:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Available budget</p>
          <p className="mt-2 text-2xl font-black sm:mt-3 sm:text-3xl md:text-4xl">{formatMoney(available)}</p>
          <p className="mt-1.5 text-sm font-bold text-white/70 sm:mt-2">Income minus savings target</p>
        </Card>
        <Card className="p-2.5 sm:p-3.5 md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Spent this cycle</p>
          <p className="mt-1.5 text-xl font-black sm:text-2xl md:text-3xl">{formatMoney(spent)}</p>
          <div className="mt-2">
            <ProgressBar percent={budgetPercent} color={budgetColor} compact />
          </div>
        </Card>
        <Card className="p-2.5 sm:p-3.5 md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Remaining</p>
          <p className="mt-1.5 text-xl font-black sm:text-2xl md:text-3xl">{formatMoney(remaining)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700"><ShieldCheck size={13} className="mr-1" /> {safe} safe</Pill>
            <Pill className="border-amber-100 bg-amber-50 text-amber-800"><AlertTriangle size={13} className="mr-1" /> {warnings} warning</Pill>
            <Pill className="border-rose-100 bg-rose-50 text-rose-700"><LockKeyhole size={13} className="mr-1" /> {locked} locked</Pill>
          </div>
        </Card>
      </div>

      {dashboardInsight ? (
        <div className="mt-4 sm:mt-5">
          <SpendInsightCard insight={dashboardInsight} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1fr_0.82fr]">
        <section className="content-start">
          <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
            <div>
              <h2 className="text-base font-black text-[#10201c] sm:text-lg">Category fences</h2>
              <p className="text-xs font-bold text-slate-500">Tap a tile to review purchases.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/categories">View all</Link>
            </Button>
          </div>
          {state.categories.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
              {state.categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.id}`} className="block rounded-[1.15rem] transition active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#58c6a8]/20 sm:rounded-[1.55rem]">
                  <CategoryCard category={category} purchases={state.purchases} budgetMonth={state.budgetMonth} variant="compact" />
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={WalletCards}
                title="Your budget categories are ready to be shaped"
                body="Start with one or two spending areas you want to watch. SpendFence will use them to organize purchases and surface pacing alerts."
                action={
                  <Button asChild size="sm">
                    <Link href="/categories">
                      <Plus size={16} /> Add category
                    </Link>
                  </Button>
                }
              />
            </Card>
          )}
        </section>

        <section className="grid content-start gap-4 sm:gap-5">
          <div className="grid items-stretch gap-3 md:grid-cols-2">
            <SmartPromptsPanel prompts={prompts} isPro={isPro} />

            <Card className="h-full p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-black sm:text-base">Recurring charges</h2>
                <Link href="/add-purchase" className="inline-flex items-center text-xs font-black text-[var(--brand-primary)]">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              {upcomingRecurring.length ? (
                <div className="grid gap-2">
                  {upcomingRecurring.slice(0, 2).map(({ item, date }) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--app-secondary)] px-2.5 py-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <p className="text-sm font-black leading-5">{item.name}</p>
                          <span className={item.kind === "income" ? "shrink-0 text-[0.68rem] font-black text-emerald-700" : "shrink-0 text-[0.68rem] font-black text-slate-500"}>
                            {recurringKindLabel(item.kind)}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] font-bold text-slate-500">
                          <CalendarClock size={12} /> {formatShortDate(date.toISOString())} - {recurringFrequencyLabel(item.frequency)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={item.kind === "income" ? "text-sm font-black text-emerald-700" : "text-sm font-black"}>
                          {item.kind === "income" ? "+" : "-"}{formatMoney(item.amount)}
                        </p>
                        <p className="text-[0.65rem] font-bold text-slate-500">{formatMoney(monthlyRecurringAmount(item))}/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-secondary)] p-3 text-xs font-bold leading-5 text-[var(--app-text-muted)]">
                  Mark recurring purchases or paycheck income to see upcoming dates.
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Recent purchases</h2>
            {cyclePurchases.length ? (
              <div className="grid gap-2">
                {cyclePurchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2.5 sm:rounded-2xl sm:p-3">
                    <div>
                      <p className="text-sm font-black sm:text-base">{purchase.merchant}</p>
                      <p className="text-xs font-bold text-slate-500 sm:text-sm">{formatShortDate(purchase.date)}</p>
                    </div>
                    <p className="text-sm font-black sm:text-base">{formatMoney(purchase.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={ReceiptText}
                title="Your first purchase this cycle will land here"
                body="When you add a purchase, it will show up here with its category and cycle date."
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/add-purchase">
                      <Plus size={16} /> Add purchase
                    </Link>
                  </Button>
                }
              />
            )}
          </Card>
        </section>
      </div>
    </>
  );
}

function SmartPromptsPanel({ prompts, isPro }: { prompts: Prompt[]; isPro: boolean }) {
  return (
    <IntelligenceSection
      title="Smart Prompts"
      tierLabel={isPro ? "Advanced Intelligence" : "Basic Intelligence"}
      tierIcon={Brain}
      premiumLabel={isPro ? undefined : "Premium"}
      tierDescription={isPro ? "Advanced pattern recognition and deeper insights are active." : "Short adaptive nudges for this cycle. Advanced analytics and deeper insights included with Premium."}
      sourceLabel={prompts.length > 2 ? "Reports ready" : undefined}
      className="mb-0 h-full sm:mb-0"
      variant="flagship"
    >
      {prompts.length ? (
        <div className="grid gap-3 p-3.5 sm:p-4">
          {prompts.slice(0, 2).map((prompt, index) => (
            <PromptCard key={prompt.id} prompt={prompt} index={index} />
          ))}
          {prompts.length > 2 ? (
            <Link href="/reports" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[rgb(99_102_241_/_0.16)] bg-white/72 px-3 text-xs font-black text-[#4F46E5] shadow-[0_10px_24px_rgb(99_102_241_/_0.08)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.06] dark:text-[#C4B5FD]">
              View all insights <ChevronRight size={14} />
            </Link>
          ) : null}
        </div>
      ) : (
        <IntelligenceEmptyState title="No smart prompts yet." body="SpendFence will surface short setup notes once categories and purchases exist." />
      )}
    </IntelligenceSection>
  );
}

function PromptCard({ prompt, index }: { prompt: Prompt; index: number }) {
  return (
    <article
      className={cn(
        intelligenceCardSurfaceClass,
        "group min-h-[6.75rem] p-3.5 motion-safe:animate-[fade-up_420ms_ease-out_both]",
        index === 1 && "motion-safe:[animation-delay:90ms]"
      )}
    >
      <div className={intelligenceAccentRailClass} />
      <div className="pointer-events-none absolute -right-14 -top-16 h-28 w-28 rounded-full bg-[rgb(99_102_241_/_0.13)] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start gap-3">
        <div className={cn(intelligenceIconSurfaceClass, "h-9 w-9 sm:h-9 sm:w-9")}>
          <Sparkles size={15} className="motion-safe:animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-black leading-5 text-[#10201c] dark:text-[#F4F7F6]">Adaptive prompt</h3>
            <Pill className="border-[rgb(99_102_241_/_0.16)] bg-white/70 px-2 py-0 text-[0.65rem] capitalize text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-[#A7B3BC]">
              {prompt.type}
            </Pill>
          </div>
          <p className="mt-1.5 text-xs font-semibold leading-5 text-[#536173] dark:text-[#A7B3BC] sm:text-sm">{prompt.message}</p>
        </div>
      </div>
    </article>
  );
}

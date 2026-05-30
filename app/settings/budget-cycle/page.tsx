"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback } from "@/components/settings-ui";
import { currentCycleWindow } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function BudgetCycleSettingsPage() {
  const state = useSpendFence();
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");

  const cycle = currentCycleWindow(state.budgetMonth);
  const startDateValue = state.budgetMonth.budgetCycleStartDate ?? toDateValue(cycle.start);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function updateStartDate(value: string) {
    const selected = parseDateValue(value);
    if (!selected) return;

    state.updateBudgetMonth({
      ...state.budgetMonth,
      budgetCycleStartDate: value,
      budgetCycleStartDay: selected.getDate()
    });
    showFeedback("Budget cycle updated.");
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Budget Cycle" subtitle="Set when your budget cycle starts." />
      <SettingsFeedback message={feedback} />

      <div className="settings-section-stack">
        <section className="settings-group grid w-full min-w-0 gap-2">
          <h2 className="px-1.5 text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Current cycle</h2>
          <div className="native-list settings-native-list w-full min-w-0 overflow-hidden">
            <div className="settings-native-pad">
              <p className="section-kicker text-[var(--brand-primary)]">This cycle</p>
              <p className="mt-2 text-2xl font-black leading-tight tracking-tight text-[var(--app-text)] sm:text-3xl">{formatCycleRange(cycle.start, cycle.end)}</p>
            </div>
            <div className="report-metric-strip settings-native-pad border-t border-[var(--glass-hairline)]">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">Starts</p>
                <p className="mt-1 text-sm font-black text-[var(--app-text)] sm:text-base">{formatFullDate(cycle.start)}</p>
              </div>
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">Ends</p>
                <p className="mt-1 text-sm font-black text-[var(--app-text)] sm:text-base">{formatFullDate(cycle.end)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-group grid w-full min-w-0 gap-2">
          <h2 className="px-1.5 text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Reset day</h2>
          <div className="native-list settings-native-list w-full min-w-0 overflow-hidden">
            <label className="native-row settings-native-row relative grid min-h-[3.05rem] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3.5 py-2 transition hover:bg-[color:rgb(255_255_255_/_0.055)] sm:min-h-[3.3rem] sm:px-4 sm:py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.72rem] bg-brand-gradient text-[#06110d] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.16),0_6px_14px_rgb(0_0_0_/_0.14)] sm:h-9 sm:w-9">
                <CalendarDays size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-5 text-[var(--app-text)]">Cycle start date</span>
                <span className="mt-0.5 block text-[0.72rem] font-bold leading-4 text-[var(--app-text-muted)] sm:text-xs sm:leading-5">{formatFullDate(parseDateValue(startDateValue) ?? cycle.start)}</span>
              </span>
              <span className="hidden shrink-0 rounded-full border border-[var(--glass-hairline)] bg-[var(--glass-interactive-bg)] px-2.5 py-1 text-xs font-black text-[var(--app-text-secondary)] sm:inline-flex">
                {formatShortDate(parseDateValue(startDateValue) ?? cycle.start)}
              </span>
              <ChevronRight size={17} className="shrink-0 text-[var(--app-text-muted)] opacity-70" />
              <input
                ref={inputRef}
                type="date"
                value={startDateValue}
                onChange={(event) => updateStartDate(event.target.value)}
                onClick={() => inputRef.current?.showPicker?.()}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Edit cycle start date"
              />
            </label>
          </div>
          <p className="px-1.5 text-[0.72rem] font-semibold leading-4 text-[var(--app-text-muted)]">
            Your budget resets on this day each month. Changing it recalculates the current cycle window and how spending is grouped.
          </p>
        </section>
      </div>
    </div>
  );
}

function formatCycleRange(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

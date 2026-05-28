"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup } from "@/components/settings-ui";
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

      <div className="grid gap-5">
        <SettingsGroup title="Cycle">
          <div className="border-b border-[var(--app-border)] bg-[var(--app-secondary)] px-5 py-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Current cycle</p>
            <p className="mt-1 text-xl font-black tracking-tight text-[var(--app-text)] sm:text-2xl">{formatCycleRange(cycle.start, cycle.end)}</p>
            <p className="mt-1.5 text-xs font-bold leading-5 text-[var(--app-text-secondary)] sm:text-sm sm:leading-6">Starts {formatFullDate(cycle.start)}</p>
          </div>

          <label className="relative grid min-h-[3.95rem] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3.5 py-3 transition hover:bg-[var(--app-secondary)] sm:min-h-[4.5rem] sm:px-5 sm:py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white dark:text-[#0B1114] sm:h-10 sm:w-10 sm:rounded-[0.9rem]">
              <CalendarDays size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5 text-[var(--app-text)]">Cycle start date</span>
              <span className="mt-0.5 block text-xs font-bold leading-5 text-[var(--app-text-muted)]">{formatFullDate(parseDateValue(startDateValue) ?? cycle.start)}</span>
            </span>
            <span className="hidden shrink-0 rounded-full border border-[var(--app-border)] bg-[var(--app-secondary)] px-2.5 py-1 text-xs font-black text-[var(--app-text-secondary)] sm:inline-flex">
              {formatShortDate(parseDateValue(startDateValue) ?? cycle.start)}
            </span>
            <ChevronRight size={18} className="shrink-0 text-[var(--app-text-muted)]" />
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
        </SettingsGroup>
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

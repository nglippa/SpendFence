"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, DollarSign, PiggyBank, Save } from "lucide-react";
import { ConfirmSheet, SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Button, Input } from "@/components/ui";
import { currentCycleLabel, formatMoney, totalSpent } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { BudgetMonth } from "@/lib/types";

export default function BudgetCycleSettingsPage() {
  const state = useSpendFence();
  const [monthDraft, setMonthDraft] = useState(state.budgetMonth.month);
  const [dayDraft, setDayDraft] = useState(String(state.budgetMonth.budgetCycleStartDay));
  const [incomeDraft, setIncomeDraft] = useState(String(state.budgetMonth.income));
  const [savingsDraft, setSavingsDraft] = useState(String(state.budgetMonth.savingsTarget));
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [pendingBudgetMonth, setPendingBudgetMonth] = useState<BudgetMonth | null>(null);
  const [pendingChange, setPendingChange] = useState(0);

  useEffect(() => {
    setMonthDraft(state.budgetMonth.month);
    setDayDraft(String(state.budgetMonth.budgetCycleStartDay));
    setIncomeDraft(String(state.budgetMonth.income));
    setSavingsDraft(String(state.budgetMonth.savingsTarget));
  }, [state.budgetMonth.budgetCycleStartDay, state.budgetMonth.income, state.budgetMonth.month, state.budgetMonth.savingsTarget]);

  const previewBudgetMonth = useMemo(
    () => ({
      ...state.budgetMonth,
      month: monthDraft.trim() || state.budgetMonth.month,
      budgetCycleStartDay: parseValidDay(dayDraft) ?? state.budgetMonth.budgetCycleStartDay,
      income: parseDecimal(incomeDraft),
      savingsTarget: parseDecimal(savingsDraft)
    }),
    [dayDraft, incomeDraft, monthDraft, savingsDraft, state.budgetMonth]
  );

  const hasChanges =
    monthDraft !== state.budgetMonth.month ||
    dayDraft !== String(state.budgetMonth.budgetCycleStartDay) ||
    parseDecimal(incomeDraft) !== state.budgetMonth.income ||
    parseDecimal(savingsDraft) !== state.budgetMonth.savingsTarget;

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function saveBudgetMonth(next: BudgetMonth, message = "Budget cycle updated.") {
    state.updateBudgetMonth(next);
    setError("");
    showFeedback(message);
  }

  function saveChanges() {
    const nextDay = parseValidDay(dayDraft);
    if (!nextDay) {
      setError("Choose a day between 1 and 31.");
      setDayDraft(String(state.budgetMonth.budgetCycleStartDay));
      return;
    }

    const nextBudgetMonth = {
      ...state.budgetMonth,
      month: monthDraft.trim() || state.budgetMonth.month,
      budgetCycleStartDay: nextDay,
      income: parseDecimal(incomeDraft),
      savingsTarget: parseDecimal(savingsDraft)
    };

    const cycleDayChanged = nextBudgetMonth.budgetCycleStartDay !== state.budgetMonth.budgetCycleStartDay;
    const change = cycleDayChanged ? Math.abs(totalSpent(state.purchases, state.budgetMonth) - totalSpent(state.purchases, nextBudgetMonth)) : 0;
    if (change >= 100) {
      setPendingBudgetMonth(nextBudgetMonth);
      setPendingChange(change);
      return;
    }
    saveBudgetMonth(nextBudgetMonth);
  }

  function restoreDayIfEmpty() {
    if (!dayDraft.trim()) {
      setDayDraft(String(state.budgetMonth.budgetCycleStartDay));
      setError("");
      return;
    }
    if (!parseValidDay(dayDraft)) setError("Choose a day between 1 and 31.");
    else setError("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Budget Cycle" subtitle="Choose when your budget resets and keep the core monthly numbers tidy." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-4">
        <SettingsGroup title="Cycle">
          <SettingsRow
            icon={CalendarDays}
            title="Budget month label"
            subtitle="A short label for this budget period."
            accessory={<Input value={monthDraft} onChange={(event) => setMonthDraft(event.target.value)} className="min-h-10 w-28 rounded-xl text-right text-sm sm:w-36" aria-label="Budget month label" />}
          />
          <SettingsRow
            icon={CalendarDays}
            title="Budget start day"
            subtitle="Day of month, 1 through 31."
            accessory={
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={dayDraft}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                  setDayDraft(next);
                  if (error) setError("");
                }}
                onBlur={restoreDayIfEmpty}
                placeholder="1"
                className="min-h-10 w-16 rounded-xl text-center text-base"
                aria-label="Budget start day"
              />
            }
          />
          <SettingsRow icon={CalendarDays} title="Current cycle preview" subtitle={readableCyclePreview(previewBudgetMonth)} />
        </SettingsGroup>

        {error ? <p className="-mt-2 px-1 text-sm font-bold text-[var(--app-danger)]">{error}</p> : null}

        <SettingsGroup title="Budget numbers">
          <SettingsRow
            icon={DollarSign}
            title="Monthly income"
            subtitle="Used for the dashboard budget calculation."
            accessory={<Input inputMode="decimal" value={incomeDraft} onChange={(event) => setIncomeDraft(event.target.value)} className="min-h-10 w-28 rounded-xl text-right text-sm sm:w-36" aria-label="Monthly income" />}
          />
          <SettingsRow
            icon={PiggyBank}
            title="Savings target"
            subtitle="Set aside before available spending."
            accessory={<Input inputMode="decimal" value={savingsDraft} onChange={(event) => setSavingsDraft(event.target.value)} className="min-h-10 w-28 rounded-xl text-right text-sm sm:w-36" aria-label="Savings target" />}
          />
          <SettingsRow icon={Save} title="Preview" subtitle={`${formatMoney(parseDecimal(incomeDraft))} income / ${formatMoney(parseDecimal(savingsDraft))} savings`} />
        </SettingsGroup>

        <Button type="button" size="lg" onClick={saveChanges} disabled={!hasChanges}>
          <Save size={18} /> Save Budget Cycle
        </Button>
      </div>

      <ConfirmSheet
        open={Boolean(pendingBudgetMonth)}
        title="Update budget reset day?"
        body={`This will change displayed cycle totals by ${formatMoney(pendingChange)}. Existing purchases will stay saved.`}
        confirmLabel="Update"
        onCancel={() => {
          setPendingBudgetMonth(null);
          setPendingChange(0);
          setDayDraft(String(state.budgetMonth.budgetCycleStartDay));
        }}
        onConfirm={() => {
          if (pendingBudgetMonth) saveBudgetMonth(pendingBudgetMonth);
          setPendingBudgetMonth(null);
          setPendingChange(0);
        }}
      />
    </div>
  );
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseValidDay(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
}

function readableCyclePreview(budgetMonth: Pick<BudgetMonth, "budgetCycleStartDay">) {
  return currentCycleLabel(budgetMonth).replace("Current cycle: ", "");
}

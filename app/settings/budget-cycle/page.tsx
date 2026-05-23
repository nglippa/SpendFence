"use client";

import { useEffect, useState } from "react";
import { CalendarDays, DollarSign, PiggyBank, Save } from "lucide-react";
import { ConfirmSheet, SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Field, Input } from "@/components/ui";
import { currentCycleLabel, currentCycleWindow, formatMoney, totalSpent } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";
import type { BudgetMonth } from "@/lib/types";

export default function BudgetCycleSettingsPage() {
  const state = useSpendFence();
  const [incomeDraft, setIncomeDraft] = useState(String(state.budgetMonth.income));
  const [savingsDraft, setSavingsDraft] = useState(String(state.budgetMonth.savingsTarget));
  const [cycleStartDraft, setCycleStartDraft] = useState(() => toDateValue(currentCycleWindow(state.budgetMonth).start));
  const [feedback, setFeedback] = useState("");
  const [pendingBudgetMonth, setPendingBudgetMonth] = useState<BudgetMonth | null>(null);
  const [pendingChange, setPendingChange] = useState(0);

  useEffect(() => {
    setIncomeDraft(String(state.budgetMonth.income));
    setSavingsDraft(String(state.budgetMonth.savingsTarget));
  }, [state.budgetMonth.income, state.budgetMonth.savingsTarget]);

  useEffect(() => {
    setCycleStartDraft(toDateValue(currentCycleWindow(state.budgetMonth).start));
  }, [state.budgetMonth.budgetCycleStartDay]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function updateBudgetMonth(next: BudgetMonth, message = "Budget cycle updated.") {
    state.updateBudgetMonth(next);
    showFeedback(message);
  }

  function commitCycleStart(value: string) {
    const selected = fromDateValue(value);
    if (!selected) return;
    const nextDay = selected.getDate();
    if (nextDay === state.budgetMonth.budgetCycleStartDay) return;

    const nextBudgetMonth = { ...state.budgetMonth, budgetCycleStartDay: nextDay };
    const change = Math.abs(totalSpent(state.purchases, state.budgetMonth) - totalSpent(state.purchases, nextBudgetMonth));
    if (change >= 100) {
      setPendingBudgetMonth(nextBudgetMonth);
      setPendingChange(change);
      return;
    }
    updateBudgetMonth(nextBudgetMonth);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Budget Cycle" subtitle="Choose when your budget resets and keep the core monthly numbers tidy." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-4">
        <SettingsGroup title="Cycle">
          <div className="grid gap-3 border-b border-slate-100 p-3">
            <Field label="Budget month label">
              <Input value={state.budgetMonth.month} onChange={(event) => updateBudgetMonth({ ...state.budgetMonth, month: event.target.value }, "Budget month label updated.")} />
            </Field>
            <Field label="Budget month start date">
              <Input
                type="date"
                value={cycleStartDraft}
                onChange={(event) => {
                  setCycleStartDraft(event.target.value);
                  commitCycleStart(event.target.value);
                }}
              />
            </Field>
          </div>
          <SettingsRow icon={CalendarDays} title={currentCycleLabel(state.budgetMonth)} subtitle="Choose the day your budget resets each month." />
        </SettingsGroup>

        <SettingsGroup title="Budget numbers">
          <div className="grid gap-3 border-b border-slate-100 p-3 sm:grid-cols-2">
            <Field label="Monthly income">
              <Input
                inputMode="decimal"
                value={incomeDraft}
                onChange={(event) => setIncomeDraft(event.target.value)}
                onBlur={() => updateBudgetMonth({ ...state.budgetMonth, income: parseDecimal(incomeDraft) }, "Income updated.")}
              />
            </Field>
            <Field label="Savings target">
              <Input
                inputMode="decimal"
                value={savingsDraft}
                onChange={(event) => setSavingsDraft(event.target.value)}
                onBlur={() => updateBudgetMonth({ ...state.budgetMonth, savingsTarget: parseDecimal(savingsDraft) }, "Savings target updated.")}
              />
            </Field>
          </div>
          <SettingsRow icon={DollarSign} title={formatMoney(state.budgetMonth.income)} subtitle="Monthly income" />
          <SettingsRow icon={PiggyBank} title={formatMoney(state.budgetMonth.savingsTarget)} subtitle="Planned savings before spending" />
          <SettingsRow icon={Save} title="Saved automatically" subtitle="Changes stay on this device for the MVP." />
        </SettingsGroup>
      </div>

      <ConfirmSheet
        open={Boolean(pendingBudgetMonth)}
        title="Update budget reset day?"
        body={`This will change displayed cycle totals by ${formatMoney(pendingChange)}. Existing purchases will stay saved.`}
        confirmLabel="Update"
        onCancel={() => {
          setPendingBudgetMonth(null);
          setPendingChange(0);
          setCycleStartDraft(toDateValue(currentCycleWindow(state.budgetMonth).start));
        }}
        onConfirm={() => {
          if (pendingBudgetMonth) updateBudgetMonth(pendingBudgetMonth);
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

function toDateValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

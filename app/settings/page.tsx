"use client";

import { DatabaseZap, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, Pill } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function SettingsPage() {
  const state = useSpendFence();

  return (
    <>
      <PageHeader kicker="Settings" title="Budget controls" body="Adjust the month, keep data local, and see future bank-sync readiness." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-black">Budget month</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Month">
              <Input value={state.budgetMonth.month} onChange={(event) => state.updateBudgetMonth({ ...state.budgetMonth, month: event.target.value })} />
            </Field>
            <Field label="Monthly income">
              <Input inputMode="decimal" value={state.budgetMonth.income} onChange={(event) => state.updateBudgetMonth({ ...state.budgetMonth, income: Number(event.target.value) })} />
            </Field>
            <Field label="Savings target">
              <Input inputMode="decimal" value={state.budgetMonth.savingsTarget} onChange={(event) => state.updateBudgetMonth({ ...state.budgetMonth, savingsTarget: Number(event.target.value) })} />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">
            <Save size={18} /> Saved automatically on this device.
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
              <DatabaseZap size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Bank Sync Coming Soon</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Plaid is not integrated yet. Future transaction imports can map into the existing purchase model with source `future-bank-import`.
              </p>
              <Pill className="mt-4 border-slate-200 bg-white text-slate-600">No bank connection active</Pill>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Local-first data</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Categories, purchases, receipts, prompts, and notifications persist in localStorage for the MVP.
              </p>
              <p className="mt-3 text-sm font-black text-slate-700">{state.categories.length} categories - {state.purchases.length} purchases - income {formatMoney(state.budgetMonth.income)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Demo controls</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Reset local data back to the curated sample budget.</p>
          <Button variant="secondary" className="mt-4" onClick={() => state.resetDemoData()}>
            <RefreshCw size={18} /> Reset demo data
          </Button>
        </Card>
      </div>
    </>
  );
}

"use client";

import { LogOut, RefreshCw, Save, ShieldAlert, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PageHeader, Pill } from "@/components/ui";
import { BankSyncCard } from "@/components/bank-sync-card";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function SettingsPage() {
  const state = useSpendFence();
  const auth = useAuth();
  const router = useRouter();

  async function logout() {
    await auth.signOut();
    router.replace("/login");
  }

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

        <div className="grid gap-5 lg:col-span-2">
          <BankSyncCard />
        </div>

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
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
              <UserRound size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black">Account</h2>
              <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">
                Signed in as {auth.user?.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill className="border-slate-200 bg-white text-slate-600">{auth.planLabel} plan</Pill>
                {auth.user?.isDemo ? <Pill className="border-amber-100 bg-amber-50 text-amber-800">Demo Mode</Pill> : null}
                {auth.demoProEnabled ? <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">Demo Pro</Pill> : null}
              </div>
              <Button variant="secondary" className="mt-4" onClick={logout}>
                <LogOut size={18} /> Log out
              </Button>
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

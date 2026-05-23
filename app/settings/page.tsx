"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ListChecks, LogOut, RefreshCw, Save, ScanLine, ShieldAlert, UserRound, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PageHeader, Pill } from "@/components/ui";
import { BankSyncCard } from "@/components/bank-sync-card";
import { MfaSettings } from "@/components/mfa-settings";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

const secondaryTools = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/receipt-scanner", label: "Receipt scanner", icon: ScanLine },
  { href: "/transaction-review", label: "Review queue", icon: ListChecks },
  { href: "/categories", label: "Budget categories", icon: WalletCards }
];

export default function SettingsPage() {
  const state = useSpendFence();
  const auth = useAuth();
  const router = useRouter();
  const [incomeDraft, setIncomeDraft] = useState(String(state.budgetMonth.income));
  const [savingsDraft, setSavingsDraft] = useState(String(state.budgetMonth.savingsTarget));

  useEffect(() => {
    setIncomeDraft(String(state.budgetMonth.income));
    setSavingsDraft(String(state.budgetMonth.savingsTarget));
  }, [state.budgetMonth.income, state.budgetMonth.savingsTarget]);

  async function logout() {
    await auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader kicker="Settings" title="Budget controls" body="Adjust the month, keep data local, and see future bank-sync readiness." />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Budget month</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Month">
              <Input value={state.budgetMonth.month} onChange={(event) => state.updateBudgetMonth({ ...state.budgetMonth, month: event.target.value })} />
            </Field>
            <Field label="Monthly income">
              <Input
                inputMode="decimal"
                value={incomeDraft}
                onChange={(event) => setIncomeDraft(event.target.value)}
                onBlur={() => state.updateBudgetMonth({ ...state.budgetMonth, income: parseDecimal(incomeDraft) })}
              />
            </Field>
            <Field label="Savings target">
              <Input
                inputMode="decimal"
                value={savingsDraft}
                onChange={(event) => setSavingsDraft(event.target.value)}
                onBlur={() => state.updateBudgetMonth({ ...state.budgetMonth, savingsTarget: parseDecimal(savingsDraft) })}
              />
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-sm font-black text-emerald-700 sm:mt-4 sm:rounded-2xl sm:p-3">
            <Save size={18} /> Saved automatically on this device.
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">More tools</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {secondaryTools.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex min-h-11 items-center gap-2.5 rounded-xl bg-[#f7faf7] px-3 text-sm font-black text-slate-700 transition hover:bg-[#edf4ef] sm:rounded-2xl">
                <Icon size={17} className="text-[#327d6d]" />
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:gap-5 lg:col-span-2">
          <BankSyncCard />
        </div>

        <MfaSettings />

        <Card>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800 sm:h-12 sm:w-12 sm:rounded-2xl">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black sm:text-xl">Local-first data</h2>
              <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
                Categories, purchases, receipts, prompts, and notifications persist in localStorage for the MVP.
              </p>
              <p className="mt-2.5 text-sm font-black text-slate-700 sm:mt-3">{state.categories.length} categories - {state.purchases.length} purchases - income {formatMoney(state.budgetMonth.income)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36] sm:h-12 sm:w-12 sm:rounded-2xl">
              <UserRound size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black sm:text-xl">Account</h2>
              <p className="mt-1.5 break-words text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
                Signed in as {auth.user?.email}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
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
          <h2 className="text-lg font-black sm:text-xl">AI categorization</h2>
          <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
            When enabled, imported transactions can use server-side AI as a fallback after merchant rules, keywords, and Plaid category hints. If `OPENAI_API_KEY` is missing, SpendFence uses local rules only.
          </p>
          <button
            onClick={() => state.updateAiCategorization(!state.aiCategorizationEnabled)}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-[#f7faf7] p-3 text-left sm:mt-4 sm:rounded-3xl sm:p-4"
          >
            <span>
              <span className="block text-sm font-black text-[#10201c] sm:text-base">AI categorization {state.aiCategorizationEnabled ? "on" : "off"}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-600 sm:text-sm">Only merchant text, amount, Plaid category, and category names are sent.</span>
            </span>
            <span className={`h-6 w-11 shrink-0 rounded-full p-1 transition sm:h-7 sm:w-12 ${state.aiCategorizationEnabled ? "bg-[#183f36]" : "bg-slate-300"}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition sm:h-5 sm:w-5 ${state.aiCategorizationEnabled ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </Card>

        <Card>
          <h2 className="text-lg font-black sm:text-xl">Demo controls</h2>
          <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">Reset local data back to the curated sample budget.</p>
          <Button variant="secondary" className="mt-4" onClick={() => state.resetDemoData()}>
            <RefreshCw size={18} /> Reset demo data
          </Button>
        </Card>
      </div>
    </>
  );
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

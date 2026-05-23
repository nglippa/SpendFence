"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, CheckCircle2, LockKeyhole, RefreshCw, Sparkles } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isPremiumFeatureEnabled, premiumFeatures } from "@/lib/premium-features";
import { useSpendFence } from "@/lib/store";
import type { ImportedTransactionInput } from "@/lib/types";
import { PremiumBadge } from "@/components/upgrade-modal";

export function BankSyncCard() {
  const auth = useAuth();
  const state = useSpendFence();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bankSyncEnabled = auth.isPro && isPremiumFeatureEnabled("bank-sync");

  async function connectBank() {
    setMessage("");
    if (!bankSyncEnabled) {
      setMessage("Bank sync is marked as a future Premium area. Subscriptions are not enabled yet.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/plaid/create-link-token", {
      method: "POST",
      headers: { "x-spendfence-plan": bankSyncEnabled ? "pro" : "free" }
    });
    setLoading(false);

    const data = (await response.json()) as { linkToken?: string; message?: string };
    if (!response.ok || !data.linkToken) {
      setMessage(data.message ?? "Plaid Sandbox is ready once PLAID_CLIENT_ID and PLAID_SECRET are set on the server.");
      return;
    }

    const plaid = await loadPlaidLink();
    if (!plaid) {
      setMessage("Plaid Link could not load in this browser. Try again after checking network access.");
      return;
    }

    plaid.create({
      token: data.linkToken,
      onSuccess: async (publicToken: string) => {
        const exchange = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-spendfence-plan": bankSyncEnabled ? "pro" : "free"
          },
          body: JSON.stringify({ publicToken })
        });
        const exchangeData = (await exchange.json()) as { message?: string };
        setMessage(exchangeData.message ?? "Sandbox account connected.");
      },
      onExit: () => setMessage("Plaid Sandbox connection was closed. Nothing changed.")
    }).open();
  }

  async function importSandboxTransactions() {
    setMessage("");
    if (!bankSyncEnabled) {
      setMessage("Automatic imports are planned for Premium. You can keep using manual entry and receipt review today.");
      return;
    }
    const response = await fetch("/api/plaid/import-transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-spendfence-plan": bankSyncEnabled ? "pro" : "free"
      },
      body: JSON.stringify({ userCategories: state.categories, merchantRules: state.merchantCategoryRules })
    });
    const data = (await response.json()) as { transactions?: ImportedTransactionInput[]; message?: string };
    if (!response.ok || !data.transactions) {
      setMessage(data.message ?? "Sandbox transactions could not be imported.");
      return;
    }
    state.addImportedTransactions(data.transactions);
    setMessage("Sandbox transactions were added to the Transaction Review queue.");
  }

  return (
    <>
      <Card>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36] sm:h-12 sm:w-12 sm:rounded-2xl">
            {bankSyncEnabled ? <Building2 size={20} /> : <LockKeyhole size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black sm:text-xl">{premiumFeatures["bank-sync"].title}</h2>
              <PremiumBadge />
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
              {premiumFeatures["bank-sync"].description} SpendFence will keep sensitive bank credentials out of the app.
            </p>
            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
              {["Automatic transaction imports", "Connected account management", "Transaction review queue", "Smart category suggestions"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-black text-slate-700 sm:rounded-2xl sm:p-3">
                  <CheckCircle2 size={16} className="text-[#58c6a8]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              <Button onClick={connectBank} disabled={loading || !bankSyncEnabled}>
                <LockKeyhole size={18} />
                {loading ? "Preparing Sandbox..." : "Bank sync planned"}
              </Button>
              <Button variant="secondary" onClick={importSandboxTransactions} disabled={!bankSyncEnabled}>
                Sandbox imports planned
              </Button>
              <Pill className="border-[#d9e7ff] bg-[#f4f8ff] text-[#315f96]">Subscriptions not enabled</Pill>
              <Pill className="border-slate-200 bg-white text-slate-600">Sandbox only</Pill>
              <Pill className="border-slate-200 bg-white text-slate-600">No access tokens in frontend</Pill>
            </div>
            {message ? <p className="mt-3 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-bold leading-5 text-slate-600 sm:rounded-2xl sm:p-3 sm:leading-6">{message}</p> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <MiniFeature icon={Building2} title="Connected accounts" body="Planned for Premium once subscriptions are available." />
          <MiniFeature icon={RefreshCw} title="Review queue" body="Imported transactions will pause for review before they affect budgets." />
          <MiniFeature icon={Sparkles} title="Category suggestions" body="Premium suggestions will build on merchant rules and your corrections." />
        </div>
      </Card>
    </>
  );
}

function MiniFeature({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#183f36] shadow-soft sm:h-10 sm:w-10 sm:rounded-2xl">
        <Icon size={18} />
      </div>
      <h3 className="mt-2.5 text-sm font-black text-[#10201c] sm:mt-3 sm:text-base">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-600 sm:leading-6">{body}</p>
    </div>
  );
}

type PlaidLink = {
  create: (config: {
    token: string;
    onSuccess: (publicToken: string) => void;
    onExit: () => void;
  }) => { open: () => void };
};

declare global {
  interface Window {
    Plaid?: PlaidLink;
  }
}

function loadPlaidLink() {
  if (window.Plaid) return Promise.resolve(window.Plaid);

  return new Promise<PlaidLink | null>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Plaid ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => resolve(window.Plaid ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

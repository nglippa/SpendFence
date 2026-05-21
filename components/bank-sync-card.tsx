"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, CheckCircle2, ExternalLink, LockKeyhole, RefreshCw, Sparkles } from "lucide-react";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useSpendFence } from "@/lib/store";
import type { ImportedTransactionInput } from "@/lib/types";
import { ProBadge, UpgradeModal } from "@/components/upgrade-modal";

export function BankSyncCard() {
  const auth = useAuth();
  const state = useSpendFence();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function connectBank() {
    setMessage("");
    if (!auth.isPro) {
      setUpgradeOpen(true);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/plaid/create-link-token", {
      method: "POST",
      headers: { "x-spendfence-plan": auth.isPro ? "pro" : "free" }
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
            "x-spendfence-plan": auth.isPro ? "pro" : "free"
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
    if (!auth.isPro) {
      setUpgradeOpen(true);
      return;
    }
    const response = await fetch("/api/plaid/import-transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-spendfence-plan": auth.isPro ? "pro" : "free"
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
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
            {auth.isPro ? <Building2 size={22} /> : <LockKeyhole size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">Plaid bank sync</h2>
              <ProBadge />
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              SpendFence uses Plaid for secure bank connection. We never collect bank usernames, passwords, account numbers, routing numbers, card numbers, or CVV.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {["Automatic transaction imports", "Connected account management", "Transaction review queue", "Smart category suggestions"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-2xl bg-[#f7faf7] p-3 text-sm font-black text-slate-700">
                  <CheckCircle2 size={16} className="text-[#58c6a8]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={connectBank} disabled={loading}>
                {auth.isPro ? <ExternalLink size={18} /> : <LockKeyhole size={18} />}
                {loading ? "Preparing Sandbox..." : "Connect Bank"}
              </Button>
              <Button variant="secondary" onClick={importSandboxTransactions}>
                Import Sandbox Transactions
              </Button>
              <Pill className="border-slate-200 bg-white text-slate-600">Sandbox only</Pill>
              <Pill className="border-slate-200 bg-white text-slate-600">No access tokens in frontend</Pill>
            </div>
            {message ? <p className="mt-3 rounded-2xl bg-[#f7faf7] p-3 text-sm font-bold leading-6 text-slate-600">{message}</p> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <MiniFeature icon={Building2} title="Connected accounts" body={auth.isPro ? "No Sandbox accounts connected yet." : "Upgrade to manage synced accounts."} />
          <MiniFeature icon={RefreshCw} title="Review queue" body={auth.isPro ? "Imported transactions will wait here before they affect budgets." : "Pro users can review imports before saving."} />
          <MiniFeature icon={Sparkles} title="Category suggestions" body={auth.isPro ? "SpendFence will suggest categories from merchant patterns." : "Smart suggestions unlock with Pro."} />
        </div>
      </Card>

      {auth.demoProAvailable ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Development Demo Pro</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">Unlock Plaid Sandbox UI locally without a real subscription. Hidden in production.</p>
            </div>
            <Button variant={auth.demoProEnabled ? "secondary" : "primary"} onClick={() => auth.setDemoPro(!auth.demoProEnabled)}>
              {auth.demoProEnabled ? "Disable Demo Pro" : "Enable Demo Pro"}
            </Button>
          </div>
        </Card>
      ) : null}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

function MiniFeature({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-[#f7faf7] p-4">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#183f36] shadow-soft">
        <Icon size={18} />
      </div>
      <h3 className="mt-3 font-black text-[#10201c]">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{body}</p>
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

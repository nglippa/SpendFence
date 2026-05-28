"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, CheckCircle2, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Unplug } from "lucide-react";
import { TellerConnectButton } from "@/components/banking/teller-connect-button";
import { PremiumBadge } from "@/components/upgrade-modal";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { FREE_TELLER_ACCOUNT_LIMIT, TELLER_ACCOUNT_LIMIT_MESSAGE } from "@/lib/bank-sync-limits";
import { premiumFeatures } from "@/lib/premium-features";
import { useSpendFence } from "@/lib/store";
import type { AppTier } from "@/lib/tier";
import type { ImportedTransactionInput } from "@/lib/types";

type BankConnection = {
  id: string;
  provider: "teller";
  institution_name: string;
  enrollment_id?: string;
  created_at: string;
  updated_at: string;
  status: string;
};

type BankAccount = {
  id: string;
  name: string;
  institution: string;
  type: string;
  subtype?: string;
  currency: string;
};

type TellerAccountLimit = {
  tier: AppTier;
  accountCount: number;
  accountCountSource: "accounts" | "connections";
  accountLimit: number | null;
  canLinkMore: boolean;
  message?: string;
};

export function BankSyncCard() {
  const auth = useAuth();
  const state = useSpendFence();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountDataAvailable, setAccountDataAvailable] = useState(false);
  const [accountLimit, setAccountLimit] = useState<TellerAccountLimit | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [tellerConfigured, setTellerConfigured] = useState<boolean | null>(null);
  const bankSyncEnabled = !state.demoModeLocked;
  const activeConnection = connections.find((connection) => connection.status === "connected");
  const connectedConnections = connections.filter((connection) => connection.status === "connected");
  const connectedAccountCount = accountDataAvailable ? accounts.length : accountLimit?.accountCount ?? connectedConnections.length;
  const accountCountUsesAccounts = accountDataAvailable || accountLimit?.accountCountSource === "accounts";
  const freeLimitReached = auth.effectiveTier === "free" && connectedAccountCount >= FREE_TELLER_ACCOUNT_LIMIT;
  const accountLimitLabel = auth.effectiveTier === "premium" ? "Unlimited syncing" : `${connectedAccountCount} of ${FREE_TELLER_ACCOUNT_LIMIT} accounts connected`;
  const upgradeLimitCopy = auth.effectiveTier === "premium" ? "Unlimited account syncing active." : "Free includes 2 accounts.";

  const requestHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (auth.isDeveloper) headers["x-spendfence-dev-tier-preview"] = auth.tierPreviewMode;
    if (auth.user?.email) headers["x-spendfence-dev-email"] = auth.user.email;
    headers["x-spendfence-real-tier"] = auth.realTier;
    if (process.env.NODE_ENV === "development" && auth.user?.id) headers["x-spendfence-dev-user"] = auth.user.id;
    return headers;
  }, [auth]);

  const loadConnections = useCallback(async () => {
    if (state.demoModeLocked) return;
    try {
      const response = await fetch("/api/teller/enrollments", {
        headers: await requestHeaders(),
        cache: "no-store"
      });
      const data = (await response.json()) as { connections?: BankConnection[]; accountLimit?: TellerAccountLimit; message?: string };
      setConnections(data.connections ?? []);
      setAccountLimit(data.accountLimit ?? null);
      if (!response.ok && data.message) setMessage(data.message);
    } catch {
      setMessage("Bank connections are unavailable right now.");
    }
  }, [requestHeaders, state.demoModeLocked]);

  useEffect(() => {
    if (!bankSyncEnabled) return;
    loadConnections();
  }, [bankSyncEnabled, loadConnections]);

  useEffect(() => {
    if (state.demoModeLocked) return;
    let cancelled = false;
    fetch("/api/teller/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setTellerConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setTellerConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state.demoModeLocked]);

  async function loadAccounts(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
      setMessage("");
    }
    try {
      const response = await fetch("/api/teller/accounts", {
        headers: await requestHeaders(),
        cache: "no-store"
      });
      const data = (await response.json()) as { accounts?: BankAccount[]; message?: string };
      setAccounts(data.accounts ?? []);
      setAccountDataAvailable(response.ok);
      if (!options?.silent) setMessage(data.message ?? (response.ok ? "Connected accounts refreshed." : "Connected accounts are unavailable right now."));
    } catch {
      setAccountDataAvailable(false);
      if (!options?.silent) setMessage("Connected accounts are unavailable right now.");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  async function handleConnected() {
    await loadConnections();
    await loadAccounts({ silent: true });
  }

  function canOpenTellerConnect() {
    if (auth.effectiveTier === "free" && connectedAccountCount >= FREE_TELLER_ACCOUNT_LIMIT) {
      setMessage(TELLER_ACCOUNT_LIMIT_MESSAGE);
      return false;
    }
    return true;
  }

  async function syncTransactions() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/teller/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await requestHeaders())
        },
        body: JSON.stringify({ userCategories: state.categories, merchantRules: state.merchantCategoryRules })
      });
      const data = (await response.json()) as { transactions?: ImportedTransactionInput[]; message?: string };
      if (!response.ok || !data.transactions) {
        setMessage(data.message ?? "Teller transactions could not be synced.");
        return;
      }
      state.addImportedTransactions(data.transactions);
      setLastSyncedAt(new Date().toISOString());
      setMessage(data.message ?? "Teller transactions were added to the review queue.");
    } catch {
      setMessage("Teller transactions could not be synced.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect(connectionId?: string) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/teller/enrollments${connectionId ? `?id=${encodeURIComponent(connectionId)}` : ""}`, {
        method: "DELETE",
        headers: await requestHeaders()
      });
      const data = (await response.json()) as { message?: string };
      setMessage(data.message ?? "Bank connection disconnected.");
      setAccounts([]);
      await loadConnections();
    } catch {
      setMessage("Bank connection could not be disconnected.");
    } finally {
      setLoading(false);
    }
  }

  if (state.demoModeLocked) {
    return (
      <Card>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#183f36] sm:h-12 sm:w-12 sm:rounded-2xl">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black sm:text-xl">Bank sync disabled</h2>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-600">Bank sync is disabled in demo mode.</p>
          </div>
        </div>
      </Card>
    );
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
              {auth.effectiveTier === "premium" ? <PremiumBadge /> : null}
              <Pill className={auth.effectiveTier === "premium" ? "border-sky-100 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600"}>{accountLimitLabel}</Pill>
              {auth.isDeveloper ? <Pill className="border-sky-100 bg-sky-50 text-sky-700">Developer Preview: {auth.planLabel}</Pill> : null}
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
              Connect accounts, import transactions automatically, and review them before they affect your budget. {upgradeLimitCopy}{" "}
              {auth.effectiveTier === "free" ? (
                <Link href="/premium" className="font-black text-[var(--app-info)] underline decoration-[rgb(75_140_255_/_0.28)] underline-offset-4">
                  Premium unlocks unlimited syncing.
                </Link>
              ) : null}
            </p>
            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
              {["Secure bank login", "Private connection storage", "Transactions pause for review", "Smart category suggestions"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-black text-slate-700 sm:rounded-2xl sm:p-3">
                  <CheckCircle2 size={16} className="text-[#58c6a8]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {tellerConfigured ? (
                <TellerConnectButton disabled={!bankSyncEnabled || loading || freeLimitReached} requestHeaders={requestHeaders} onBeforeOpen={canOpenTellerConnect} onConnected={handleConnected} onMessage={setMessage} />
              ) : null}
              <Button variant="secondary" onClick={() => loadAccounts()} disabled={!bankSyncEnabled || loading || !activeConnection}>
                <RefreshCw size={18} /> Refresh accounts
              </Button>
              <Button variant="secondary" onClick={syncTransactions} disabled={!bankSyncEnabled || loading || !activeConnection}>
                <Sparkles size={18} /> Sync transactions
              </Button>
              {activeConnection ? (
                <Button variant="danger" onClick={() => disconnect(activeConnection.id)} disabled={loading}>
                  <Unplug size={18} /> Disconnect
                </Button>
              ) : null}
              {freeLimitReached ? (
                <Link href="/premium" className="inline-flex">
                  <Pill className="border-sky-100 bg-sky-50 text-sky-700">Upgrade for unlimited</Pill>
                </Link>
              ) : null}
              {tellerConfigured === false ? <Pill className="border-slate-200 bg-white text-slate-600">Bank sync setup pending</Pill> : null}
            </div>
            {freeLimitReached ? <p className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-2.5 text-sm font-bold leading-5 text-sky-800 sm:rounded-2xl sm:p-3 sm:leading-6">{TELLER_ACCOUNT_LIMIT_MESSAGE}</p> : null}
            {message ? <p className="mt-3 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-bold leading-5 text-slate-600 sm:rounded-2xl sm:p-3 sm:leading-6">{message}</p> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black sm:text-xl">Connected accounts</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {auth.effectiveTier === "premium"
                ? "Unlimited account syncing active."
                : `${connectedAccountCount} of ${FREE_TELLER_ACCOUNT_LIMIT} accounts connected`}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : accountCountUsesAccounts ? "Account count is based on connected accounts." : "Refresh accounts to update this count."}
            </p>
          </div>
          {loading ? <Pill className="border-slate-200 bg-white text-slate-600"><RefreshCw size={13} className="mr-1 animate-spin" /> Working</Pill> : null}
        </div>
        <div className="grid gap-3">
          {connections.length ? (
            connections.map((connection) => (
              <div key={connection.id} className="rounded-2xl bg-[#f7faf7] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#10201c]">{connection.institution_name}</p>
                    <p className="text-xs font-bold text-slate-500">Bank connection / {connection.status}</p>
                  </div>
                  <Pill className={connection.status === "connected" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}>
                    {connection.status}
                  </Pill>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No Teller accounts connected yet.</p>
          )}

          {accounts.map((account) => (
            <div key={account.id} className="rounded-2xl bg-[#f7faf7] p-3">
              <p className="font-black text-[#10201c]">{account.name}</p>
              <p className="text-xs font-bold text-slate-500">
                {account.institution} / {account.type}{account.subtype ? ` / ${account.subtype}` : ""} / {account.currency}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <MiniFeature icon={Building2} title="Connected accounts" body="Accounts are fetched server-side from secure stored connections." />
          <MiniFeature icon={RefreshCw} title="Review queue" body="Synced transactions are staged before they affect budgets." />
          <MiniFeature icon={ShieldCheck} title="Token safety" body="Teller access tokens are never saved in localStorage or returned to the client." />
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

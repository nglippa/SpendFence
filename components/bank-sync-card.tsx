"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, CheckCircle2, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Unplug } from "lucide-react";
import { TellerConnectButton } from "@/components/banking/teller-connect-button";
import { PremiumBadge } from "@/components/upgrade-modal";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isPremiumFeatureEnabled, premiumFeatures } from "@/lib/premium-features";
import { useSpendFence } from "@/lib/store";
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

export function BankSyncCard() {
  const auth = useAuth();
  const state = useSpendFence();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [tellerConfigured, setTellerConfigured] = useState<boolean | null>(null);
  const devTestingEnabled = process.env.NODE_ENV === "development";
  const premiumEnabled = auth.isPro && isPremiumFeatureEnabled("bank-sync");
  const bankSyncEnabled = !state.demoModeLocked && (premiumEnabled || devTestingEnabled);
  const activeConnection = connections.find((connection) => connection.status === "connected");

  const requestHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await auth.getAccessToken();
    if (token) return { Authorization: `Bearer ${token}` };
    if (process.env.NODE_ENV === "development" && auth.user?.id) return { "x-spendfence-dev-user": auth.user.id };
    return {};
  }, [auth]);

  const loadConnections = useCallback(async () => {
    if (state.demoModeLocked) return;
    try {
      const response = await fetch("/api/teller/enrollments", {
        headers: await requestHeaders(),
        cache: "no-store"
      });
      const data = (await response.json()) as { connections?: BankConnection[]; message?: string };
      setConnections(data.connections ?? []);
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

  async function loadAccounts() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/teller/accounts", {
        headers: await requestHeaders(),
        cache: "no-store"
      });
      const data = (await response.json()) as { accounts?: BankAccount[]; message?: string };
      setAccounts(data.accounts ?? []);
      setMessage(data.message ?? (response.ok ? "Connected accounts refreshed." : "Connected accounts are unavailable right now."));
    } catch {
      setMessage("Connected accounts are unavailable right now.");
    } finally {
      setLoading(false);
    }
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
              <PremiumBadge />
              {devTestingEnabled ? <Pill className="border-[#d9e7ff] bg-[#f4f8ff] text-[#315f96]">Dev testing</Pill> : null}
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">
              Connect with Teller sandbox, review imported transactions, and keep access tokens server-side.
            </p>
            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
              {["Teller Connect handles bank login", "Access tokens stay server-side", "Transactions pause for review", "Smart category suggestions"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-black text-slate-700 sm:rounded-2xl sm:p-3">
                  <CheckCircle2 size={16} className="text-[#58c6a8]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {tellerConfigured ? (
                <TellerConnectButton disabled={!bankSyncEnabled || loading} requestHeaders={requestHeaders} onConnected={loadConnections} onMessage={setMessage} />
              ) : null}
              <Button variant="secondary" onClick={loadAccounts} disabled={!bankSyncEnabled || loading || !activeConnection}>
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
              {!premiumEnabled && !devTestingEnabled ? <Pill className="border-slate-200 bg-white text-slate-600">Premium required</Pill> : null}
              {tellerConfigured === false ? <Pill className="border-slate-200 bg-white text-slate-600">Bank sync setup pending</Pill> : null}
              <Pill className="border-slate-200 bg-white text-slate-600">Teller sandbox</Pill>
            </div>
            {message ? <p className="mt-3 rounded-xl bg-[#f7faf7] p-2.5 text-sm font-bold leading-5 text-slate-600 sm:rounded-2xl sm:p-3 sm:leading-6">{message}</p> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black sm:text-xl">Connected accounts</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : "No sync has run this session."}
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
                    <p className="text-xs font-bold text-slate-500">Teller / {connection.status}</p>
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
          <MiniFeature icon={Building2} title="Connected accounts" body="Teller accounts are fetched server-side from stored enrollments." />
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

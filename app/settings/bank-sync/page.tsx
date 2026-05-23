"use client";

import { BankSyncCard } from "@/components/bank-sync-card";
import { SettingsDetailHeader } from "@/components/settings-ui";

export default function BankSyncSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SettingsDetailHeader title="Bank Sync" subtitle="Connect securely through Plaid Sandbox and review imports before they affect budgets." />
      <BankSyncCard />
    </div>
  );
}

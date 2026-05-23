"use client";

import { BankSyncCard } from "@/components/bank-sync-card";
import { SettingsDetailHeader } from "@/components/settings-ui";

export default function BankSyncSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SettingsDetailHeader title="Bank Sync" subtitle="A future Premium area for secure Plaid connections and reviewed imports." />
      <BankSyncCard />
    </div>
  );
}

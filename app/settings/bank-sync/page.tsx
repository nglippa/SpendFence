"use client";

import { BankSyncCard } from "@/components/bank-sync-card";
import { SettingsDetailHeader } from "@/components/settings-ui";

export default function BankSyncSettingsPage() {
  return (
    <div className="settings-page-frame mx-auto w-full max-w-3xl">
      <SettingsDetailHeader title="Bank Sync" subtitle="Connect accounts and import transactions." />
      <BankSyncCard />
    </div>
  );
}

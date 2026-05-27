"use client";

import { BankSyncCard } from "@/components/bank-sync-card";
import { SettingsDetailHeader } from "@/components/settings-ui";

export default function BankSyncSettingsPage() {
  return (
    <div className="settings-page-frame mx-auto w-full max-w-3xl">
      <SettingsDetailHeader title="Bank Sync" subtitle="Connect Teller sandbox accounts, review imports, and keep bank tokens server-side." />
      <BankSyncCard />
    </div>
  );
}

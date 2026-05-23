"use client";

import { useState } from "react";
import { Database, Download, RefreshCw, ShieldAlert } from "lucide-react";
import { ConfirmSheet, SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function PrivacySettingsPage() {
  const state = useSpendFence();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function exportData() {
    const payload = JSON.stringify(
      {
        budgetMonth: state.budgetMonth,
        categories: state.categories,
        purchases: state.purchases,
        receipts: state.receipts,
        importedTransactions: state.importedTransactions,
        merchantCategoryRules: state.merchantCategoryRules,
        categoryCorrections: state.categoryCorrections,
        notificationSettings: state.notificationSettings,
        aiCategorizationEnabled: state.aiCategorizationEnabled,
        exportedAt: new Date().toISOString()
      },
      null,
      2
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "spendfence-data.json";
    link.click();
    URL.revokeObjectURL(url);
    showFeedback("Data export prepared.");
  }

  function resetDemoData() {
    setWorking(true);
    window.setTimeout(() => {
      state.resetDemoData();
      setWorking(false);
      setConfirmResetOpen(false);
      showFeedback("Demo data reset successfully.");
    }, 250);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Data & Privacy" subtitle="Review local data and control reset/export actions." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-4">
        <SettingsGroup title="Local data">
          <SettingsRow icon={Database} title={`${state.categories.length} categories, ${state.purchases.length} purchases`} subtitle={`Income is ${formatMoney(state.budgetMonth.income)}. MVP data stays in localStorage on this device.`} />
          <SettingsRow icon={ShieldAlert} title="Frontend secrets stay out" subtitle="Provider tokens and AI keys belong server-side only." />
        </SettingsGroup>

        <SettingsGroup title="Actions">
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={exportData}>
              <Download size={18} /> Export data
            </Button>
            <Button variant="danger" onClick={() => setConfirmResetOpen(true)}>
              <RefreshCw size={18} /> Reset demo data
            </Button>
          </div>
        </SettingsGroup>
      </div>

      <ConfirmSheet
        open={confirmResetOpen}
        danger
        working={working}
        title="Reset demo data?"
        body="This replaces the local demo budget with the curated sample data. Your current local categories, purchases, receipts, and settings will be replaced."
        confirmLabel="Reset"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={resetDemoData}
      />
    </div>
  );
}

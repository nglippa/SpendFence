"use client";

import { useState } from "react";
import { Database, Download, RefreshCw, ShieldAlert, TestTube2 } from "lucide-react";
import { ConfirmSheet, SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

export default function PrivacySettingsPage() {
  const state = useSpendFence();
  const demoLocked = state.demoModeLocked;
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
        recurringItems: state.recurringItems,
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

  function enableDemoData() {
    if (demoLocked) {
      showFeedback("Demo mode is locked for this preview.");
      return;
    }
    try {
      state.enableDemoData();
      showFeedback("Demo data enabled.");
    } catch {
      showFeedback("Demo data could not be enabled.");
    }
  }

  function disableDemoData() {
    if (demoLocked) {
      showFeedback("Demo mode is locked for this preview.");
      return;
    }
    try {
      state.disableDemoData();
      showFeedback("Demo data disabled.");
    } catch {
      showFeedback("Demo data could not be disabled.");
    }
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Data & Privacy" subtitle="Review data, export, or reset demo mode." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-5">
        <SettingsGroup title="Local data">
          <SettingsRow icon={Database} title={`${state.categories.length} categories, ${state.purchases.length} purchases`} subtitle={`${state.demoDataEnabled ? "Demo data active." : "Personal data active."} Income: ${formatMoney(state.budgetMonth.income)}.`} />
          <SettingsRow icon={ShieldAlert} title="Secrets stay server-side" subtitle="Tokens and AI keys are not stored in the UI." />
        </SettingsGroup>

        <SettingsGroup title="Demo Data">
          <SettingsSwitchRow
            icon={TestTube2}
            title={demoLocked ? "Demo Mode Enabled" : state.demoDataEnabled ? "Disable Demo Data" : "Enable Demo Data"}
            subtitle={
              demoLocked
                ? "Locked for this preview."
                : "Use sample categories and purchases."
            }
            checked={state.demoDataEnabled}
            disabled={demoLocked}
            onChange={(checked) => {
              if (demoLocked) return;
              if (checked) enableDemoData();
              else disableDemoData();
            }}
          />
          <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
            <Button variant="secondary" onClick={enableDemoData} disabled={demoLocked || state.demoDataEnabled}>
              <TestTube2 size={18} /> Enable Demo Data
            </Button>
            <Button variant="secondary" onClick={disableDemoData} disabled={demoLocked || !state.demoDataEnabled}>
              <ShieldAlert size={18} /> Disable Demo Data
            </Button>
            <Button variant="danger" className="sm:col-span-2" onClick={() => setConfirmResetOpen(true)}>
              <RefreshCw size={18} /> Reset Demo Data
            </Button>
            {demoLocked ? (
              <p className="rounded-2xl bg-[var(--app-secondary)] px-3 py-2 text-xs font-bold leading-5 text-[var(--app-text-muted)] sm:col-span-2">
                Demo mode is locked. Create an account to use your own data.
              </p>
            ) : null}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Actions">
          <div className="grid gap-2.5 p-4 sm:p-5">
            <Button variant="secondary" onClick={exportData}>
              <Download size={18} /> Export data
            </Button>
          </div>
        </SettingsGroup>
      </div>

      <ConfirmSheet
        open={confirmResetOpen}
        danger
        working={working}
        title="Reset demo data?"
        body="This refreshes only the separate demo workspace with curated sample categories, purchases, and reports. Your personal categories, purchases, receipts, and settings will not be changed."
        confirmLabel="Reset"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={resetDemoData}
      />
    </div>
  );
}

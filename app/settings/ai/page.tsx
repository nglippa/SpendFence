"use client";

import { useState } from "react";
import { Brain, ScanLine } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
import { Pill } from "@/components/ui";
import { useSpendFence } from "@/lib/store";

export default function AiSettingsPage() {
  const state = useSpendFence();
  const [feedback, setFeedback] = useState("");

  function update(enabled: boolean) {
    state.updateAiCategorization(enabled);
    setFeedback("AI feature settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="AI Features" subtitle="Control server-side assistance for categorization and receipt review." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-4">
        <SettingsGroup title="Categorization">
          <SettingsSwitchRow
            icon={Brain}
            title="AI purchase categorization"
            subtitle="Server-side category suggestions are included for all users and always require review before saving."
            checked={state.aiCategorizationEnabled}
            onChange={update}
            accessory={<Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Included</Pill>}
          />
        </SettingsGroup>
        <SettingsGroup title="Receipt suggestions">
          <SettingsRow
            icon={ScanLine}
            title="AI receipt analysis"
            subtitle="Receipt text understanding, line-item extraction, category suggestions, and split allocations are included for all users. Review suggestions before saving."
            accessory={<Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Included</Pill>}
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

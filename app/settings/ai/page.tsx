"use client";

import { useState } from "react";
import { Brain, ScanLine } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
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
            title="AI categorization"
            subtitle="Imported transactions can use server-side AI after merchant rules, keywords, and Plaid category hints."
            checked={state.aiCategorizationEnabled}
            onChange={update}
          />
        </SettingsGroup>
        <SettingsGroup title="Receipt suggestions">
          <SettingsRow
            icon={ScanLine}
            title="Receipt review stays manual-confirmed"
            subtitle="Receipt suggestions can be edited before saving. Images and sensitive payment details should not be stored unless confirmed."
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

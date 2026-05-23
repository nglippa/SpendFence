"use client";

import { useState } from "react";
import { Brain, ScanLine } from "lucide-react";
import { PremiumBadge } from "@/components/upgrade-modal";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
import { premiumFeatures } from "@/lib/premium-features";
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
            title={premiumFeatures["ai-categorization"].title}
            subtitle={`${premiumFeatures["ai-categorization"].description} Marked as a future Premium area.`}
            checked={state.aiCategorizationEnabled}
            onChange={update}
            accessory={<PremiumBadge />}
          />
        </SettingsGroup>
        <SettingsGroup title="Receipt suggestions">
          <SettingsRow
            icon={ScanLine}
            title={premiumFeatures["ai-receipt-understanding"].title}
            subtitle={`${premiumFeatures["ai-receipt-understanding"].description} Receipt suggestions stay manual-confirmed before saving.`}
            accessory={<PremiumBadge />}
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Brain, Gauge, ScanLine, SlidersHorizontal } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
import { Pill, Select } from "@/components/ui";
import { useSpendFence } from "@/lib/store";
import type { AdaptiveFenceSettings } from "@/lib/types";

export default function AiSettingsPage() {
  const state = useSpendFence();
  const [feedback, setFeedback] = useState("");

  function update(enabled: boolean) {
    state.updateAiCategorization(enabled);
    setFeedback("AI feature settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function updateAdaptiveSettings(settings: AdaptiveFenceSettings) {
    state.updateAdaptiveFenceSettings(settings);
    setFeedback("Adaptive AI settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
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
        <SettingsGroup title="Adaptive AI">
          <SettingsSwitchRow
            icon={Gauge}
            title="Adaptive Suggestions"
            subtitle="SpendFence can suggest small fence adjustments as category patterns stabilize."
            checked={state.adaptiveFenceSettings.enabled}
            onChange={(enabled) => updateAdaptiveSettings({ ...state.adaptiveFenceSettings, enabled })}
            accessory={<Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Free</Pill>}
          />
          <SettingsRow
            icon={SlidersHorizontal}
            title="Suggestion Frequency"
            subtitle="Choose how often SpendFence surfaces fence ideas."
            accessory={
              <Select
                value={state.adaptiveFenceSettings.frequency}
                onChange={(event) => updateAdaptiveSettings({ ...state.adaptiveFenceSettings, frequency: event.target.value as AdaptiveFenceSettings["frequency"] })}
                className="min-h-10 w-36 text-xs sm:w-40"
              >
                <option value="minimal">Minimal</option>
                <option value="balanced">Balanced</option>
                <option value="active">Active</option>
              </Select>
            }
          />
          <SettingsRow
            icon={Brain}
            title="Automation Level"
            subtitle="For now, changes stay review-first so SpendFence suggests instead of taking over."
            accessory={
              <Select
                value={state.adaptiveFenceSettings.automationLevel}
                onChange={(event) => updateAdaptiveSettings({ ...state.adaptiveFenceSettings, automationLevel: event.target.value as AdaptiveFenceSettings["automationLevel"] })}
                className="min-h-10 w-40 text-xs sm:w-48"
              >
                <option value="suggestions-only">Suggestions only</option>
                <option value="require-confirmation">Require confirmation</option>
                <option value="auto-apply-low-risk">Auto-apply low-risk</option>
              </Select>
            }
          />
          <SettingsRow
            icon={Gauge}
            title="Learning Sensitivity"
            subtitle="Tune how quickly SpendFence reacts to spending patterns."
            accessory={
              <Select
                value={state.adaptiveFenceSettings.learningSensitivity}
                onChange={(event) =>
                  updateAdaptiveSettings({ ...state.adaptiveFenceSettings, learningSensitivity: event.target.value as AdaptiveFenceSettings["learningSensitivity"] })
                }
                className="min-h-10 w-36 text-xs sm:w-40"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="adaptive">Adaptive</option>
              </Select>
            }
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

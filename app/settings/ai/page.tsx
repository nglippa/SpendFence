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
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="AI Features" subtitle="Control suggestions and adaptive intelligence." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-5">
        <SettingsGroup title="Categorization">
          <SettingsSwitchRow
            icon={Brain}
            title="AI purchase categorization"
            subtitle="Category suggestions require review."
            checked={state.aiCategorizationEnabled}
            onChange={update}
            accessory={<Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Included</Pill>}
          />
        </SettingsGroup>
        <SettingsGroup title="Receipt suggestions">
          <SettingsRow
            icon={ScanLine}
            title="AI receipt analysis"
            subtitle="Line items, splits, and categories."
            accessory={<Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Included</Pill>}
          />
        </SettingsGroup>
        <SettingsGroup title="Adaptive AI">
          <SettingsSwitchRow
            icon={Gauge}
            title="Adaptive Suggestions"
            subtitle="Suggest fence changes as patterns stabilize."
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
                className="min-h-10 w-28 text-xs sm:w-40"
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
            subtitle="Changes stay review-first."
            accessory={
              <Select
                value={state.adaptiveFenceSettings.automationLevel}
                onChange={(event) => updateAdaptiveSettings({ ...state.adaptiveFenceSettings, automationLevel: event.target.value as AdaptiveFenceSettings["automationLevel"] })}
                className="min-h-10 w-32 text-xs sm:w-48"
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
            subtitle="Adjust reaction speed."
            accessory={
              <Select
                value={state.adaptiveFenceSettings.learningSensitivity}
                onChange={(event) =>
                  updateAdaptiveSettings({ ...state.adaptiveFenceSettings, learningSensitivity: event.target.value as AdaptiveFenceSettings["learningSensitivity"] })
                }
                className="min-h-10 w-28 text-xs sm:w-40"
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

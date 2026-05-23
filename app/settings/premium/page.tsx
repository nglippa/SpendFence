"use client";

import { useState } from "react";
import { Crown, Sparkles } from "lucide-react";
import { ProBadge, UpgradeModal } from "@/components/upgrade-modal";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow, SettingsSwitchRow } from "@/components/settings-ui";
import { Button, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function PremiumSettingsPage() {
  const auth = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  function toggleDemoPro(enabled: boolean) {
    auth.setDemoPro(enabled);
    setFeedback(enabled ? "Demo Pro enabled." : "Demo Pro disabled.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Premium" subtitle="Plan status and local development Pro controls." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-4">
        <SettingsGroup title="Plan">
          <SettingsRow icon={Crown} title={`${auth.planLabel} plan`} subtitle="SpendFence Pro unlocks bank sync and review flows." accessory={<Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">{auth.planLabel}</Pill>} />
          <div className="p-3">
            <Button onClick={() => setUpgradeOpen(true)} className="w-full">
              <Sparkles size={18} /> View Pro options
            </Button>
          </div>
        </SettingsGroup>

        {auth.demoProAvailable ? (
          <SettingsGroup title="Development">
            <SettingsSwitchRow
              icon={Sparkles}
              title="Demo Pro"
              subtitle="Unlock Pro UI locally without a real subscription. Hidden in production."
              checked={auth.demoProEnabled}
              onChange={toggleDemoPro}
            />
          </SettingsGroup>
        ) : null}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

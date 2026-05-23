"use client";

import { Crown } from "lucide-react";
import { PremiumBadge } from "@/components/upgrade-modal";
import { SettingsDetailHeader, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Pill } from "@/components/ui";
import { premiumFeatures } from "@/lib/premium-features";

export default function PremiumSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Premium" subtitle="Future Premium areas are marked now. Subscription checkout is not enabled yet." />
      <div className="grid gap-4">
        <SettingsGroup title="Status">
          <SettingsRow
            icon={Crown}
            title="Premium architecture"
            subtitle="SpendFence is prepared for future Premium capabilities without turning on paid subscriptions."
            accessory={<Pill className="border-slate-200 bg-white text-slate-600">Planned</Pill>}
          />
        </SettingsGroup>

        <SettingsGroup title="Future Premium Areas">
          {Object.values(premiumFeatures).map((feature) => (
            <SettingsRow key={feature.id} icon={feature.icon} title={feature.title} subtitle={feature.description} accessory={<PremiumBadge />} />
          ))}
        </SettingsGroup>
      </div>
    </div>
  );
}

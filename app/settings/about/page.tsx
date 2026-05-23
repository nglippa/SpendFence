"use client";

import { Code2, Info, ShieldCheck, Smartphone } from "lucide-react";
import { SettingsDetailHeader, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Pill } from "@/components/ui";

export default function AboutSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="About" subtitle="SpendFence MVP notes and product posture." />
      <div className="grid gap-4">
        <SettingsGroup title="App">
          <SettingsRow icon={Info} title="SpendFence" subtitle="A clean local-first budget control app." accessory={<Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">MVP</Pill>} />
          <SettingsRow icon={Smartphone} title="iPhone-first layout" subtitle="Designed for compact dashboard scans and quick purchase entry." />
        </SettingsGroup>
        <SettingsGroup title="Principles">
          <SettingsRow icon={ShieldCheck} title="Local-first by default" subtitle="The MVP keeps budget data on this device unless a server feature is explicitly used." />
          <SettingsRow icon={Code2} title="Read-only financial integrations" subtitle="Future brokerage/bank import architecture must not place trades or move money." />
        </SettingsGroup>
      </div>
    </div>
  );
}

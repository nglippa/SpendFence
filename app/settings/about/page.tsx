"use client";

import { Code2, Info, ShieldCheck, Smartphone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SettingsDetailHeader, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Pill } from "@/components/ui";

export default function AboutSettingsPage() {
  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="About" subtitle="Version and product notes." />
      <div className="grid gap-5">
        <SettingsGroup title="App">
          <div className="native-row settings-native-row flex items-center gap-4 px-4 py-4">
            <BrandLogo alt="SpendFence logo" className="h-20 w-auto" />
            <div>
              <p className="text-base font-black text-[var(--app-text)] sm:text-lg">SpendFence</p>
              <p className="mt-0.5 text-xs font-bold leading-5 text-[var(--app-text-secondary)] sm:text-sm">Official brand mark</p>
            </div>
          </div>
          <SettingsRow icon={Info} title="SpendFence" subtitle="Adaptive budget control." accessory={<Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">MVP</Pill>} />
          <SettingsRow icon={Smartphone} title="iPhone-first" subtitle="Built for quick daily scans." />
        </SettingsGroup>
        <SettingsGroup title="Principles">
          <SettingsRow icon={ShieldCheck} title="Local-first" subtitle="Budget data stays on this device by default." />
          <SettingsRow icon={Code2} title="Read-only finance" subtitle="Imports never trade or move money." />
        </SettingsGroup>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Circle, Layers3, Monitor, Moon, Palette, Smartphone, Sun } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import type { AppearancePreference } from "@/lib/appearance";
import { useAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const options = [
  { key: "graphite", label: "Graphite", body: "Force the premium graphite interface.", icon: Moon },
  { key: "slate", label: "Slate", body: "Force the slightly lighter slate interface.", icon: Layers3 },
  { key: "dark", label: "Dark", body: "Force the standard dark interface.", icon: Circle },
  { key: "light", label: "Light", body: "Force the standard light interface.", icon: Sun },
  { key: "system", label: "Follow System", body: "Match this device automatically.", icon: Smartphone }
] satisfies Array<{ key: AppearancePreference; label: string; body: string; icon: LucideIcon }>;

export default function AppearanceSettingsPage() {
  const { preference, setPreference } = useAppearance();
  const [feedback, setFeedback] = useState("");

  function updateTheme(nextTheme: AppearancePreference) {
    setPreference(nextTheme);
    setFeedback("Appearance updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Appearance" subtitle="Keep SpendFence readable on this device." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="Theme">
        {options.map(({ key, label, body, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateTheme(key)}
            className="native-row settings-native-row grid min-h-[3.55rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-[color:rgb(255_255_255_/_0.055)] active:scale-[0.995] sm:min-h-[3.95rem] sm:px-4 sm:py-3"
            aria-pressed={preference === key}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.72rem] bg-brand-gradient text-[#06110d] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.16),0_6px_14px_rgb(0_0_0_/_0.14)] sm:h-9 sm:w-9">
              <Icon size={17} />
            </div>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5 text-[var(--app-text)]">{label}</span>
              <span className="mt-0.5 block text-xs font-bold leading-5 text-[var(--app-text-muted)]">{body}</span>
            </span>
            <span className={cn("grid h-6 w-6 place-items-center rounded-full border", preference === key ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]" : "border-[var(--app-border)] bg-[var(--app-card)]")}>
              {preference === key ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--app-card)]" /> : null}
            </span>
          </button>
        ))}
      </SettingsGroup>
      <div className="mt-5">
        <SettingsGroup title="Display">
          <SettingsRow icon={Monitor} title="System matching" subtitle="Follow System responds to device appearance changes." />
          <SettingsRow icon={Palette} title="Theme memory" subtitle="Your selected display mode is saved on this device." />
        </SettingsGroup>
      </div>
    </div>
  );
}

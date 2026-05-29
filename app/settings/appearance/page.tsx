"use client";

import { useState } from "react";
import { Moon, Palette, Smartphone, Sun } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import type { AppearancePreference } from "@/lib/appearance";
import { useAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const options = [
  { key: "dark", label: "Graphite", body: "Use the premium graphite interface.", icon: Moon },
  { key: "light", label: "Slate", body: "Use a slightly lighter slate interface.", icon: Sun },
  { key: "system", label: "Follow System", body: "Follow this device automatically.", icon: Smartphone }
] satisfies Array<{ key: AppearancePreference; label: string; body: string; icon: typeof Sun }>;

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
            className="grid min-h-[3.95rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--app-border)] px-3.5 py-3 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] active:scale-[0.995] sm:min-h-[4.5rem] sm:px-5 sm:py-3.5"
            aria-pressed={preference === key}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[#06110d] sm:h-10 sm:w-10 sm:rounded-[0.9rem]">
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
          <SettingsRow icon={Palette} title="Device-ready" subtitle="Optimized for iPhone, PWA, and desktop." />
        </SettingsGroup>
      </div>
    </div>
  );
}

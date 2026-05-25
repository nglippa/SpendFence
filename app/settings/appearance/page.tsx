"use client";

import { useState } from "react";
import { Moon, Palette, Smartphone, Sun } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import type { AppearancePreference } from "@/lib/appearance";
import { useAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const options = [
  { key: "light", label: "Light", body: "Use the clean light interface.", icon: Sun },
  { key: "dark", label: "Dark", body: "Use the premium dark interface.", icon: Moon },
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
    <div className="mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Appearance" subtitle="Keep SpendFence readable on this device." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="Theme">
        {options.map(({ key, label, body, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateTheme(key)}
            className="flex min-h-16 w-full items-center gap-3 border-b border-[var(--app-border)] px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] active:scale-[0.995]"
            aria-pressed={preference === key}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
              <Icon size={18} />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-[var(--app-text)] sm:text-base">{label}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-4 text-[var(--app-text-muted)] sm:text-sm sm:leading-5">{body}</span>
            </span>
            <span className={cn("grid h-6 w-6 place-items-center rounded-full border", preference === key ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]" : "border-[var(--app-border)] bg-[var(--app-card)]")}>
              {preference === key ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--app-card)]" /> : null}
            </span>
          </button>
        ))}
      </SettingsGroup>
      <div className="mt-4">
        <SettingsGroup title="Display">
          <SettingsRow icon={Palette} title="Device-ready appearance" subtitle="Light, dark, and system appearance are optimized for iPhone, PWA, and desktop use." />
        </SettingsGroup>
      </div>
    </div>
  );
}

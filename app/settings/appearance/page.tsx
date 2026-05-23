"use client";

import { useEffect, useState } from "react";
import { Moon, Palette, Smartphone, Sun } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { cn } from "@/lib/utils";

const options = [
  { key: "system", label: "System", body: "Follow this device.", icon: Smartphone },
  { key: "light", label: "Light", body: "Use the current calm light interface.", icon: Sun },
  { key: "dark", label: "Dark", body: "Reserved for a future dark theme.", icon: Moon }
];

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState("system");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setTheme(window.localStorage.getItem("spendfence-theme-v1") ?? "system");
  }, []);

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    window.localStorage.setItem("spendfence-theme-v1", nextTheme);
    setFeedback("Appearance setting saved.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Appearance" subtitle="Keep SpendFence calm and readable on this device." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="Theme">
        {options.map(({ key, label, body, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateTheme(key)}
            className="flex min-h-16 w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[#f7faf7] active:scale-[0.995]"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#327d6d] text-white">
              <Icon size={18} />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-[#10201c] sm:text-base">{label}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-500 sm:text-sm sm:leading-5">{body}</span>
            </span>
            <span className={cn("grid h-6 w-6 place-items-center rounded-full border", theme === key ? "border-[#183f36] bg-[#183f36]" : "border-slate-300 bg-white")}>
              {theme === key ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
            </span>
          </button>
        ))}
      </SettingsGroup>
      <div className="mt-4">
        <SettingsGroup title="Display">
          <SettingsRow icon={Palette} title="Premium light interface" subtitle="The current design is optimized for compact iPhone use." />
        </SettingsGroup>
      </div>
    </div>
  );
}

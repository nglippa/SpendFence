"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2 } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Button, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { DeveloperTierPreviewMode } from "@/lib/tier";

const tierOptions: { value: DeveloperTierPreviewMode; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" }
];

export default function DeveloperSettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!auth.loading && !auth.isDeveloper) router.replace("/settings");
  }, [auth.isDeveloper, auth.loading, router]);

  if (auth.loading || !auth.isDeveloper) return null;

  function setPreviewMode(mode: DeveloperTierPreviewMode) {
    auth.setTierPreviewMode(mode);
    setFeedback(`Developer Preview: ${mode === "premium" ? "Premium" : "Free"}`);
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Developer" subtitle="Preview Free and Premium UI." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-5">
        <SettingsGroup title="Tier Preview Mode">
          <div className="settings-native-pad border-b border-[var(--app-border)]">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--app-secondary)] p-1">
              {tierOptions.map((option) => {
                const active = auth.tierPreviewMode === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "primary" : "ghost"}
                    className="min-h-10 rounded-xl"
                    onClick={() => setPreviewMode(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <SettingsRow
            icon={Code2}
            title={`Developer Preview: ${auth.planLabel}`}
            subtitle={`Real tier remains ${auth.realTier === "premium" ? "Premium" : "Free"}. Local UI only.`}
            accessory={<Pill className="border-sky-100 bg-sky-50 text-sky-700">Local only</Pill>}
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

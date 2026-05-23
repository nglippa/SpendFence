"use client";

import { MfaSettings } from "@/components/mfa-settings";
import { SettingsDetailHeader } from "@/components/settings-ui";

export default function SecuritySettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SettingsDetailHeader title="Security" subtitle="Protect your account with MFA and trusted-device controls." />
      <MfaSettings />
    </div>
  );
}

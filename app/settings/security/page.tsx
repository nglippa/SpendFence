"use client";

import { LockKeyhole } from "lucide-react";
import { MfaSettings } from "@/components/mfa-settings";
import { SettingsDetailHeader, SettingsGroup, SettingsSwitchRow } from "@/components/settings-ui";

export default function SecuritySettingsPage() {
  return (
    <div className="settings-page-frame mx-auto w-full max-w-3xl">
      <SettingsDetailHeader title="Security" subtitle="Protect your account with session-only login and MFA." />
      <div className="mb-5">
        <SettingsGroup title="Session protection">
          <SettingsSwitchRow
            icon={LockKeyhole}
            title="Require login each session"
            subtitle="For better protection, SpendFence asks you to sign in again when you start a new session."
            checked
            disabled
            onChange={() => undefined}
          />
        </SettingsGroup>
      </div>
      <MfaSettings />
    </div>
  );
}

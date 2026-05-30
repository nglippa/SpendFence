"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Button, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function AccountSettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function logout() {
    setWorking(true);
    setFeedback("Signing out");
    await auth.signOut();
    window.sessionStorage.setItem("spendfence-auth-flash-v1", "Signed out securely.");
    router.replace("/login");
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Account" subtitle="Profile and sign out." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-5">
        <SettingsGroup title="Profile">
          <SettingsRow icon={UserRound} title={auth.user?.email ?? "Signed-in user"} subtitle="Current SpendFence account" />
          <div className="native-row settings-native-row flex flex-wrap gap-2 px-3.5 py-3 sm:px-4">
            <Pill className="border-slate-200 bg-white text-slate-600">{auth.planLabel} plan</Pill>
            {auth.isDeveloper ? <Pill className="border-sky-100 bg-sky-50 text-sky-700">Developer Preview: {auth.planLabel}</Pill> : null}
            {auth.user?.isDemo ? <Pill className="border-amber-100 bg-amber-50 text-amber-800">Demo Mode</Pill> : null}
          </div>
        </SettingsGroup>

        <SettingsGroup>
          <div className="settings-native-pad">
            <Button variant="secondary" className="w-full" onClick={logout} disabled={working}>
              <LogOut size={18} /> {working ? "Signing out" : "Log out"}
            </Button>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}

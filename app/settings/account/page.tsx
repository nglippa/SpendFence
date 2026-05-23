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
    setFeedback("Signing out...");
    await auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Account" subtitle="Profile, plan, and session controls." />
      <SettingsFeedback message={feedback} />
      <div className="grid gap-4">
        <SettingsGroup title="Profile">
          <SettingsRow icon={UserRound} title={auth.user?.email ?? "Signed-in user"} subtitle="Current SpendFence account" />
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-3 py-3 last:border-b-0">
            <Pill className="border-slate-200 bg-white text-slate-600">Free plan</Pill>
            {auth.user?.isDemo ? <Pill className="border-amber-100 bg-amber-50 text-amber-800">Demo Mode</Pill> : null}
          </div>
        </SettingsGroup>

        <SettingsGroup>
          <div className="p-3">
            <Button variant="secondary" className="w-full" onClick={logout} disabled={working}>
              <LogOut size={18} /> {working ? "Signing out..." : "Log out"}
            </Button>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}

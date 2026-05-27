"use client";

import {
  Bell,
  Brain,
  Building2,
  CalendarDays,
  ChevronRight,
  Crown,
  Code2,
  Database,
  Info,
  ListChecks,
  LockKeyhole,
  Palette,
  UserRound,
  WalletCards
} from "lucide-react";
import { SettingsGroup, SettingsRow } from "@/components/settings-ui";
import { Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { currentCycleLabel } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

const settingsSections = [
  [
    {
      href: "/settings/account",
      icon: UserRound,
      title: "Account",
      subtitle: "Profile, plan, and sign out"
    },
    {
      href: "/settings/budget-cycle",
      icon: CalendarDays,
      title: "Budget Cycle",
      subtitle: "Choose when your budget month resets"
    },
    {
      href: "/settings/categories",
      icon: WalletCards,
      title: "Categories",
      subtitle: "Manage budget fences and category tools"
    },
    {
      href: "/settings/spending-rules",
      icon: ListChecks,
      title: "Spending Rules",
      subtitle: "Personal guardrails for habits and thresholds"
    },
    {
      href: "/settings/notifications",
      icon: Bell,
      title: "Notifications",
      subtitle: "Tune local nudges and spending insights"
    }
  ],
  [
    {
      href: "/settings/security",
      icon: LockKeyhole,
      title: "Security",
      subtitle: "Session login and MFA controls"
    },
    {
      href: "/settings/premium",
      icon: Crown,
      title: "Premium",
      subtitle: "Plan, billing, and entitlement"
    },
    {
      href: "/settings/bank-sync",
      icon: Building2,
      title: "Bank Sync",
      subtitle: "Teller sandbox and reviewed imports"
    },
    {
      href: "/settings/ai",
      icon: Brain,
      title: "AI Features",
      subtitle: "Receipt, categorization, and adaptive fence settings"
    }
  ],
  [
    {
      href: "/settings/appearance",
      icon: Palette,
      title: "Appearance",
      subtitle: "Display preferences"
    },
    {
      href: "/settings/privacy",
      icon: Database,
      title: "Data & Privacy",
      subtitle: "Local data, export, and reset controls"
    },
    {
      href: "/settings/about",
      icon: Info,
      title: "About",
      subtitle: "Version and app notes"
    }
  ]
];

export default function SettingsPage() {
  const auth = useAuth();
  const state = useSpendFence();
  const developerSection = auth.isDeveloper
    ? [
        {
          href: "/settings/developer",
          icon: Code2,
          title: "Developer",
          subtitle: "Tier preview mode"
        }
      ]
    : [];
  const sections = developerSection.length ? [...settingsSections, developerSection] : settingsSections;

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <div className="mb-5 px-1 pt-1">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">Settings</p>
        <h1 className="mt-2 text-3xl font-black leading-9 tracking-tight text-[#10201c]">SpendFence</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">{auth.planLabel} plan</Pill>
          {auth.isDeveloper ? <Pill className="border-sky-100 bg-sky-50 text-sky-700">Developer Preview: {auth.planLabel}</Pill> : null}
          <Pill className="border-slate-200 bg-white text-slate-600">{currentCycleLabel(state.budgetMonth).replace("Current cycle: ", "")}</Pill>
        </div>
      </div>

      <div className="grid gap-5">
        {sections.map((section, index) => (
          <SettingsGroup key={index}>
            {section.map((item) => (
              <SettingsRow key={item.href} {...item} accessory={<ChevronRight size={18} className="shrink-0 text-slate-300" />} />
            ))}
          </SettingsGroup>
        ))}
      </div>
    </div>
  );
}

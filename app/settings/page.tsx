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
      subtitle: "Profile and session"
    },
    {
      href: "/settings/budget-cycle",
      icon: CalendarDays,
      title: "Budget Cycle",
      subtitle: "Monthly reset date"
    },
    {
      href: "/settings/categories",
      icon: WalletCards,
      title: "Categories",
      subtitle: "Budget fences"
    },
    {
      href: "/settings/spending-rules",
      icon: ListChecks,
      title: "Spending Rules",
      subtitle: "Custom alerts"
    },
    {
      href: "/settings/notifications",
      icon: Bell,
      title: "Notifications",
      subtitle: "Nudges and inbox"
    }
  ],
  [
    {
      href: "/settings/security",
      icon: LockKeyhole,
      title: "Security",
      subtitle: "Login and MFA"
    },
    {
      href: "/settings/premium",
      icon: Crown,
      title: "Premium",
      subtitle: "Plan and billing"
    },
    {
      href: "/settings/bank-sync",
      icon: Building2,
      title: "Bank Sync",
      subtitle: "Accounts and imports"
    },
    {
      href: "/settings/ai",
      icon: Brain,
      title: "AI Features",
      subtitle: "Insights and suggestions"
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
      subtitle: "Export and reset"
    },
    {
      href: "/settings/about",
      icon: Info,
      title: "About",
      subtitle: "Version and notes"
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
        <h1 className="mt-1.5 text-[1.7rem] font-black leading-8 tracking-tight text-[#10201c] sm:text-3xl sm:leading-9">SpendFence</h1>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
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

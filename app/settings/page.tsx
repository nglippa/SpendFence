"use client";

import {
  Bell,
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
import { PageHeader, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { currentCycleLabel } from "@/lib/budget";
import { useSpendFence } from "@/lib/store";

const settingsSections = [
  {
    title: "Budgeting",
    items: [
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
    ]
  },
  {
    title: "Account & Billing",
    items: [
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
      }
    ]
  },
  {
    title: "App",
    items: [
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
  }
];

export default function SettingsPage() {
  const auth = useAuth();
  const state = useSpendFence();
  const developerSection = auth.isDeveloper
    ? [
        {
          title: "Developer",
          items: [
            {
              href: "/settings/developer",
              icon: Code2,
              title: "Developer",
              subtitle: "Tier preview mode"
            }
          ]
        }
      ]
    : [];
  const sections = [...settingsSections, ...developerSection];
  const accountEmail = auth.user?.email ?? "SpendFence account";
  const accountInitial = (auth.user?.email?.trim()?.[0] ?? "S").toUpperCase();
  const cycleLabel = currentCycleLabel(state.budgetMonth).replace("Current cycle: ", "");

  return (
    <>
      <PageHeader
        kicker="Settings"
        title="SpendFence"
        body="Account, preferences, subscription, and support controls in one place."
      />

      <div className="settings-native-page">
        <div className="settings-section-stack">
          <section className="settings-group grid w-full min-w-0 gap-2">
            <div className="native-list settings-native-list w-full min-w-0 overflow-hidden">
              <div className="native-row settings-native-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 sm:px-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.95rem] bg-brand-gradient text-lg font-black text-[#06110d] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.16),0_6px_14px_rgb(0_0_0_/_0.14)]">
                  {accountInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-5 text-[var(--app-text)]">{accountEmail}</p>
                  <p className="mt-0.5 truncate text-[0.72rem] font-bold leading-4 text-[var(--app-text-muted)]">{cycleLabel}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">{auth.planLabel}</Pill>
                  {auth.isDeveloper ? <Pill className="border-sky-100 bg-sky-50 text-sky-700">Dev: {auth.planLabel}</Pill> : null}
                </div>
              </div>
            </div>
          </section>

          {sections.map((section) => (
            <SettingsGroup key={section.title} title={section.title}>
              {section.items.map((item) => (
                <SettingsRow key={item.href} {...item} accessory={<ChevronRight size={17} className="shrink-0 text-[var(--app-text-muted)] opacity-70" />} />
              ))}
            </SettingsGroup>
          ))}
        </div>
      </div>
    </>
  );
}

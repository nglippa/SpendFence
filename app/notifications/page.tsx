"use client";

import { Bell, CalendarCheck, CalendarDays, CheckCircle2, Gauge, LockKeyhole, TriangleAlert } from "lucide-react";
import { Button, PageHeader, Pill } from "@/components/ui";
import { SettingsGroup, SettingsSwitchRow } from "@/components/settings-ui";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

const settingDefs = [
  { key: "fiftyPercent", label: "50% spent", subtitle: "Heads-up at the halfway mark", icon: Gauge },
  { key: "eightyPercent", label: "80% warning", subtitle: "Warn as a fence gets close", icon: TriangleAlert },
  { key: "limitReached", label: "100% limit reached", subtitle: "Alert the moment a fence is hit", icon: LockKeyhole },
  { key: "dailySummary", label: "Daily spending summary", subtitle: "A short daily recap", icon: CalendarDays },
  { key: "weeklyCheckIn", label: "Weekly budget check-in", subtitle: "A weekly pacing review", icon: CalendarCheck }
] as const;

export default function NotificationsPage() {
  const state = useSpendFence();
  const unread = state.notifications.filter((item) => !item.read).length;

  return (
    <>
      <PageHeader kicker="Notifications" title="In-app nudges only" body="MVP notifications are local and visible inside the app. Native push can come later." />

      <div className="grid gap-5 sm:gap-6">
        <SettingsGroup title="Notification settings">
          {settingDefs.map(({ key, label, subtitle, icon }) => (
            <SettingsSwitchRow
              key={key}
              icon={icon}
              title={label}
              subtitle={subtitle}
              checked={state.notificationSettings[key]}
              onChange={(value) => state.updateNotificationSettings({ ...state.notificationSettings, [key]: value })}
            />
          ))}
        </SettingsGroup>

        <section className="settings-group grid w-full min-w-0 gap-3">
          <div className="flex items-center justify-between gap-3 px-1.5">
            <h2 className="text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-muted)]">Notification inbox</h2>
            <Pill className="border-[rgb(95_164_142_/_0.24)] bg-[color:rgb(95_164_142_/_0.12)] text-[var(--brand-secondary)]">{unread} unread</Pill>
          </div>

          {state.notifications.length ? (
            state.notifications.map((notification) => (
              <article key={notification.id} className="flow-zone-muted flex items-start gap-3 p-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] sm:h-11 sm:w-11 ${
                    notification.level === "locked"
                      ? "bg-[color:rgb(207_113_109_/_0.16)] text-[var(--app-danger)]"
                      : notification.level === "warning"
                        ? "bg-[color:rgb(214_170_90_/_0.16)] text-[#d8a85a]"
                        : "bg-[color:rgb(95_164_142_/_0.16)] text-[var(--brand-secondary)]"
                  }`}
                >
                  {notification.read ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[var(--app-text)] sm:text-base">{notification.title}</p>
                  <p className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--app-text-secondary)] [overflow-wrap:anywhere]">{notification.body}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{formatShortDate(notification.createdAt)}</p>
                </div>
                {!notification.read ? (
                  <Button variant="secondary" size="sm" onClick={() => state.markNotificationRead(notification.id)}>
                    Read
                  </Button>
                ) : null}
              </article>
            ))
          ) : (
            <p className="px-1.5 text-sm font-semibold leading-5 text-[var(--app-text-muted)]">
              Quiet for now — SpendFence keeps this space for useful budget warnings and check-ins, not noise.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

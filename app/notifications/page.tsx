"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, Pill } from "@/components/ui";
import { useSpendFence } from "@/lib/store";
import { formatShortDate } from "@/lib/utils";

const settingLabels = [
  ["fiftyPercent", "50% spent"],
  ["eightyPercent", "80% warning"],
  ["limitReached", "100% limit reached"],
  ["dailySummary", "Daily spending summary"],
  ["weeklyCheckIn", "Weekly budget check-in"]
] as const;

export default function NotificationsPage() {
  const state = useSpendFence();

  return (
    <>
      <PageHeader kicker="Notifications" title="In-app nudges only" body="MVP notifications are local and visible inside the app. Native push can come later." />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <h2 className="mb-3 text-lg font-black sm:mb-4 sm:text-xl">Notification settings</h2>
          <div className="grid gap-2.5 sm:gap-3">
            {settingLabels.map(([key, label]) => {
              const checked = state.notificationSettings[key];
              return (
                <button
                  key={key}
                  onClick={() => state.updateNotificationSettings({ ...state.notificationSettings, [key]: !checked })}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[#f7faf7] px-3 text-left text-sm font-black sm:min-h-14 sm:rounded-2xl sm:px-4 sm:text-base"
                >
                  <span>{label}</span>
                  <span className={`grid h-7 w-12 shrink-0 place-items-center rounded-full text-xs sm:h-8 sm:w-14 ${checked ? "bg-[#183f36] text-white" : "bg-slate-200 text-slate-500"}`}>
                    {checked ? "On" : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-lg font-black sm:text-xl">Notification inbox</h2>
            <Pill className="border-slate-200 bg-white text-slate-600">{state.notifications.filter((item) => !item.read).length} unread</Pill>
          </div>
          {state.notifications.length ? (
            <div className="grid gap-2.5 sm:gap-3">
              {state.notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl bg-[#f7faf7] p-3 sm:rounded-3xl sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${notification.level === "locked" ? "bg-rose-50 text-rose-700" : notification.level === "warning" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
                      {notification.read ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black sm:text-base">{notification.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{notification.body}</p>
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">{formatShortDate(notification.createdAt)}</p>
                    </div>
                    {!notification.read ? (
                      <Button variant="secondary" size="sm" onClick={() => state.markNotificationRead(notification.id)}>
                        Read
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="Quiet for now"
              body="SpendFence will keep this space for useful budget warnings and check-ins, not noise."
            />
          )}
        </Card>
      </div>
    </>
  );
}

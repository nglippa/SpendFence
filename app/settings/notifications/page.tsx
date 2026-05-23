"use client";

import { useState } from "react";
import { Bell, CalendarClock, CheckCircle2, Gauge, LockKeyhole, TrendingUp } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsSwitchRow } from "@/components/settings-ui";
import { useSpendFence } from "@/lib/store";

const settings = [
  { key: "fiftyPercent", title: "50% spent", subtitle: "A quiet nudge when a category reaches halfway.", icon: Gauge },
  { key: "eightyPercent", title: "80% warning", subtitle: "A stronger heads-up before a category gets tight.", icon: TrendingUp },
  { key: "limitReached", title: "Limit reached", subtitle: "Show when a category crosses its hard stop.", icon: LockKeyhole },
  { key: "dailySummary", title: "Daily spending summary", subtitle: "Reserved for a future local summary.", icon: CalendarClock },
  { key: "weeklyCheckIn", title: "Weekly budget check-in", subtitle: "A weekly prompt to review the cycle.", icon: CheckCircle2 }
] as const;

export default function NotificationSettingsPage() {
  const state = useSpendFence();
  const [feedback, setFeedback] = useState("");

  function update(key: keyof typeof state.notificationSettings, value: boolean) {
    state.updateNotificationSettings({ ...state.notificationSettings, [key]: value });
    setFeedback("Notification settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsDetailHeader title="Notifications" subtitle="Tune local spending nudges without adding noise." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="In-app nudges">
        {settings.map((item) => (
          <SettingsSwitchRow
            key={item.key}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            checked={state.notificationSettings[item.key]}
            onChange={(checked) => update(item.key, checked)}
          />
        ))}
      </SettingsGroup>
      <div className="mt-4">
        <SettingsGroup title="Inbox">
          <SettingsSwitchRow
            icon={Bell}
            title={`${state.notifications.filter((item) => !item.read).length} unread nudges`}
            subtitle="Open Notifications from the app header to review recent messages."
            checked={state.notifications.some((item) => !item.read)}
            disabled
            onChange={() => undefined}
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bell, Brain, CalendarClock, CheckCircle2, Gauge, LayoutDashboard, LockKeyhole, MessageCircle, TrendingUp } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsSwitchRow } from "@/components/settings-ui";
import { useSpendFence } from "@/lib/store";

const settings = [
  { key: "fiftyPercent", title: "50% spent", subtitle: "Quiet halfway nudge.", icon: Gauge },
  { key: "eightyPercent", title: "80% warning", subtitle: "Heads-up before it gets tight.", icon: TrendingUp },
  { key: "limitReached", title: "Limit reached", subtitle: "Show hard-stop alerts.", icon: LockKeyhole },
  { key: "dailySummary", title: "Daily summary", subtitle: "Future local summary.", icon: CalendarClock },
  { key: "weeklyCheckIn", title: "Weekly check-in", subtitle: "Review the cycle weekly.", icon: CheckCircle2 }
] as const;

type BooleanInsightSetting = "spendingInsights" | "showDashboardInsights";

export default function NotificationSettingsPage() {
  const state = useSpendFence();
  const [feedback, setFeedback] = useState("");

  function update(key: keyof typeof state.notificationSettings, value: boolean) {
    state.updateNotificationSettings({ ...state.notificationSettings, [key]: value });
    setFeedback("Notification settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function updateInsight(key: BooleanInsightSetting, value: boolean) {
    state.updateInsightSettings({ ...state.insightSettings, [key]: value });
    setFeedback("Insight settings updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function updateTone(value: typeof state.insightSettings.encouragementTone) {
    state.updateInsightSettings({ ...state.insightSettings, encouragementTone: value });
    setFeedback("Insight tone updated.");
    window.setTimeout(() => setFeedback(""), 1800);
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Notifications" subtitle="Tune nudges and inbox behavior." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="Spending insights">
        <SettingsSwitchRow
          icon={Brain}
          title="Spending insights"
          subtitle="Generate local spending feedback."
          checked={state.insightSettings.spendingInsights}
          onChange={(checked) => updateInsight("spendingInsights", checked)}
        />
        <SettingsSwitchRow
          icon={LayoutDashboard}
          title="Show insights on dashboard"
          subtitle="Show one insight on Home."
          checked={state.insightSettings.showDashboardInsights}
          onChange={(checked) => updateInsight("showDashboardInsights", checked)}
        />
        <div className="flex min-h-[4.5rem] items-center gap-3.5 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:px-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] bg-[#327d6d] text-white">
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-5 text-[#10201c]">Encouragement tone</p>
            <p className="mt-0.5 text-xs font-bold leading-5 text-slate-500">Supportive language level.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-black">
            {(["minimal", "balanced"] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => updateTone(tone)}
                className={`rounded-lg px-3 py-2 capitalize transition ${
                  state.insightSettings.encouragementTone === tone ? "bg-white text-[#183f36] shadow-soft" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>
      <div className="mt-5">
        <SettingsGroup title="Privacy">
          <SettingsSwitchRow
            icon={CheckCircle2}
            title="Generated locally"
            subtitle="Insights stay on this device."
            checked
            disabled
            onChange={() => undefined}
          />
        </SettingsGroup>
      </div>
      <div className="mt-5">
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
      </div>
      <div className="mt-5">
        <SettingsGroup title="Inbox">
          <SettingsSwitchRow
            icon={Bell}
            title={`${state.notifications.filter((item) => !item.read).length} unread nudges`}
            subtitle="Review recent messages."
            checked={state.notifications.some((item) => !item.read)}
            disabled
            onChange={() => undefined}
          />
        </SettingsGroup>
      </div>
    </div>
  );
}

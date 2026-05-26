"use client";

import { useState } from "react";
import { Bell, Brain, CalendarClock, CheckCircle2, Gauge, LayoutDashboard, LockKeyhole, MessageCircle, TrendingUp } from "lucide-react";
import { SettingsDetailHeader, SettingsFeedback, SettingsGroup, SettingsSwitchRow } from "@/components/settings-ui";
import { useSpendFence } from "@/lib/store";

const settings = [
  { key: "fiftyPercent", title: "50% spent", subtitle: "A quiet nudge when a category reaches halfway.", icon: Gauge },
  { key: "eightyPercent", title: "80% warning", subtitle: "A stronger heads-up before a category gets tight.", icon: TrendingUp },
  { key: "limitReached", title: "Limit reached", subtitle: "Show when a category crosses its hard stop.", icon: LockKeyhole },
  { key: "dailySummary", title: "Daily spending summary", subtitle: "Reserved for a future local summary.", icon: CalendarClock },
  { key: "weeklyCheckIn", title: "Weekly budget check-in", subtitle: "A weekly prompt to review the cycle.", icon: CheckCircle2 }
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
      <SettingsDetailHeader title="Notifications" subtitle="Tune local spending nudges without adding noise." />
      <SettingsFeedback message={feedback} />
      <SettingsGroup title="Spending insights">
        <SettingsSwitchRow
          icon={Brain}
          title="Spending insights"
          subtitle="Generate local behavioral feedback from your own categories and purchases."
          checked={state.insightSettings.spendingInsights}
          onChange={(checked) => updateInsight("spendingInsights", checked)}
        />
        <SettingsSwitchRow
          icon={LayoutDashboard}
          title="Show insights on dashboard"
          subtitle="Keep one tactful insight near the top of Home."
          checked={state.insightSettings.showDashboardInsights}
          onChange={(checked) => updateInsight("showDashboardInsights", checked)}
        />
        <div className="flex min-h-[4.5rem] items-center gap-3.5 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:px-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] bg-[#327d6d] text-white">
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-5 text-[#10201c] sm:text-base sm:leading-6">Encouragement tone</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">Choose how much supportive language SpendFence uses.</p>
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
            subtitle="No spending insight data leaves this device or app."
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

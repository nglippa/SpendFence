"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Clock3, Edit3, ListChecks, Plus, Sparkles, Trash2, WalletCards } from "lucide-react";
import { ConfirmSheet, SettingsDetailHeader, SettingsFeedback, SettingsGroup } from "@/components/settings-ui";
import { Button, Field, Input, Pill, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { buildSpendingRuleCopy, defaultSpendingRuleInput, normalizeSpendingRuleInput, suggestedFutureRules } from "@/lib/rules/rule-engine";
import { spendingRuleConditionLabels, spendingRuleResponseLabels, type SpendingRule, type SpendingRuleCondition, type SpendingRuleInput } from "@/lib/rules/rule-types";
import { useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";

const conditions: Array<{ value: SpendingRuleCondition; label: string; type: SpendingRuleInput["type"] }> = [
  { value: "exceeds_amount", label: "exceeds amount", type: "amount" },
  { value: "happens_too_often", label: "happens too often", type: "frequency" },
  { value: "spikes_unexpectedly", label: "spikes unexpectedly", type: "frequency" },
  { value: "occurs_at_times", label: "occurs at certain times", type: "time_context" },
  { value: "pace_accelerating", label: "pace is accelerating", type: "category_pacing" },
  { value: "burns_too_quickly", label: "burns too quickly early", type: "category_pacing" }
];

export default function SpendingRulesSettingsPage() {
  const state = useSpendFence();
  const { isPro } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRule, setDeletingRule] = useState<SpendingRule | null>(null);
  const [draft, setDraft] = useState<SpendingRuleInput>(() => defaultSpendingRuleInput(state.categories[0]?.id));

  const activeRules = state.spendingRules.filter((rule) => rule.source === "manual");
  const suggestions = useMemo(() => suggestedFutureRules(state.categories), [state.categories]);
  const preview = buildSpendingRuleCopy(draft, state.categories);
  const selectedCondition = conditions.find((condition) => condition.value === draft.condition) ?? conditions[0];

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function openCreate() {
    setEditingId(null);
    setDraft(defaultSpendingRuleInput(state.categories[0]?.id));
    setBuilderOpen(true);
  }

  function openEdit(rule: SpendingRule) {
    setEditingId(rule.id);
    setDraft(rule);
    setBuilderOpen(true);
  }

  function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = normalizeSpendingRuleInput(draft, state.categories);
    if (editingId) {
      state.updateSpendingRule(editingId, input);
      showFeedback("Spending rule updated.");
    } else {
      state.addSpendingRule(input);
      showFeedback("Spending rule created.");
    }
    setBuilderOpen(false);
    setEditingId(null);
  }

  function deleteRule() {
    if (!deletingRule) return;
    state.deleteSpendingRule(deletingRule.id);
    setDeletingRule(null);
    showFeedback("Spending rule deleted.");
  }

  return (
    <div className="settings-page-frame mx-auto w-full max-w-2xl">
      <SettingsDetailHeader title="Spending Rules" subtitle="Create personal guardrails that match how you want SpendFence to watch your spending." />
      <SettingsFeedback message={feedback} />

      <div className="grid gap-5">
        <SettingsGroup title="Active Rules">
          <div className="grid gap-3 p-4 sm:p-5">
            {activeRules.length ? (
              activeRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={(enabled) => state.toggleSpendingRule(rule.id, enabled)}
                  onEdit={() => openEdit(rule)}
                  onDelete={() => setDeletingRule(rule)}
                />
              ))
            ) : (
              <div className="rounded-3xl bg-[var(--app-secondary)] p-4">
                <p className="text-sm font-black text-[var(--app-text)]">No personal rules yet</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">
                  Start with one simple preference, like a dining threshold or a weekend spending awareness note.
                </p>
              </div>
            )}
            <Button type="button" onClick={openCreate} disabled={!state.categories.length}>
              <Plus size={18} /> Create Rule
            </Button>
            {!state.categories.length ? (
              <Button asChild variant="secondary">
                <Link href="/settings/categories">
                  <WalletCards size={18} /> Add a category first
                </Link>
              </Button>
            ) : null}
          </div>
        </SettingsGroup>

        {builderOpen ? (
          <SettingsGroup title={editingId ? "Edit Rule" : "Create Rule"}>
            <form className="grid gap-4 p-4 sm:p-5" onSubmit={saveRule}>
              <div className="rounded-3xl bg-[var(--app-secondary)] p-4">
                <p className="text-sm font-black text-[var(--app-text)]">{preview.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">{preview.description}</p>
              </div>

              <div className="grid gap-3">
                <Field label="1. Choose category">
                  <Select
                    value={draft.categoryId ?? ""}
                    onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                    required
                  >
                    {state.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="2. Choose condition">
                  <Select
                    value={draft.condition}
                    onChange={(event) => {
                      const condition = conditions.find((item) => item.value === event.target.value) ?? conditions[0];
                      setDraft((current) => ({ ...current, condition: condition.value, type: condition.type }));
                    }}
                  >
                    {conditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <ThresholdFields draft={draft} setDraft={setDraft} condition={selectedCondition.value} />

                <Field label="4. Choose response">
                  <Select value={draft.response} onChange={(event) => setDraft((current) => ({ ...current, response: event.target.value as SpendingRuleInput["response"] }))}>
                    <option value="subtle_insight">{spendingRuleResponseLabels.subtle_insight}</option>
                    <option value="warning">{spendingRuleResponseLabels.warning}</option>
                    <option value="pacing_alert">{spendingRuleResponseLabels.pacing_alert}</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button type="button" variant="secondary" onClick={() => setBuilderOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Save Rule" : "Add Rule"}</Button>
              </div>
            </form>
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Suggested Rules (Future AI)">
          <div className="grid gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-3xl bg-[var(--app-secondary)] p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] bg-brand-gradient text-white">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-black text-[var(--app-text)]">AI-generated rules</p>
                  <Pill className={isPro ? "border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]" : "border-slate-200 bg-white text-slate-600"}>
                    {isPro ? "Premium ready" : "Premium"}
                  </Pill>
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">
                  Premium will add predictive behavioral alerts, adaptive thresholds, merchant pattern intelligence, and cross-cycle analysis.
                </p>
              </div>
            </div>
            {suggestions.map((suggestion) => (
              <div key={suggestion.title} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-card)] p-4">
                <p className="text-sm font-black text-[var(--app-text)]">{suggestion.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">{suggestion.body}</p>
              </div>
            ))}
          </div>
        </SettingsGroup>
      </div>

      <ConfirmSheet
        open={Boolean(deletingRule)}
        danger
        title="Delete spending rule?"
        body={`Remove "${deletingRule?.title ?? "this rule"}"? SpendFence will stop using it in insights and adaptive suggestions.`}
        confirmLabel="Delete"
        onCancel={() => setDeletingRule(null)}
        onConfirm={deleteRule}
      />
    </div>
  );
}

function ThresholdFields({
  draft,
  condition,
  setDraft
}: {
  draft: SpendingRuleInput;
  condition: SpendingRuleCondition;
  setDraft: React.Dispatch<React.SetStateAction<SpendingRuleInput>>;
}) {
  if (condition === "exceeds_amount") {
    return (
      <Field label="3. Choose amount">
        <Input
          type="number"
          min="1"
          step="1"
          value={draft.thresholdAmount ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, thresholdAmount: Number(event.target.value) }))}
          placeholder="60"
          required
        />
      </Field>
    );
  }

  if (condition === "happens_too_often") {
    return (
      <div className="grid grid-cols-[1fr_8rem] gap-2.5">
        <Field label="3. Times">
          <Input
            type="number"
            min="1"
            step="1"
            value={draft.thresholdCount ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, thresholdCount: Number(event.target.value) }))}
            placeholder="3"
            required
          />
        </Field>
        <Field label="Window">
          <Select value={draft.timeWindow ?? "week"} onChange={(event) => setDraft((current) => ({ ...current, timeWindow: event.target.value as SpendingRuleInput["timeWindow"] }))}>
            <option value="week">week</option>
            <option value="cycle">cycle</option>
          </Select>
        </Field>
      </div>
    );
  }

  if (condition === "occurs_at_times") {
    return (
      <div className="grid gap-2.5">
        <Field label="3. Time context">
          <Select value={draft.timeContext ?? "late_night"} onChange={(event) => setDraft((current) => ({ ...current, timeContext: event.target.value as SpendingRuleInput["timeContext"] }))}>
            <option value="late_night">late night</option>
            <option value="weekend">weekend</option>
          </Select>
        </Field>
        <Field label="Minimum purchases">
          <Input
            type="number"
            min="1"
            step="1"
            value={draft.thresholdCount ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, thresholdCount: Number(event.target.value) }))}
            placeholder="1"
            required
          />
        </Field>
      </div>
    );
  }

  return (
    <Field label={condition === "spikes_unexpectedly" ? "3. Change threshold (%)" : "3. Pace buffer (%)"}>
      <Input
        type="number"
        min="1"
        step="1"
        value={draft.thresholdPercent ?? ""}
        onChange={(event) => setDraft((current) => ({ ...current, thresholdPercent: Number(event.target.value) }))}
        placeholder="18"
        required
      />
    </Field>
  );
}

function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete
}: {
  rule: SpendingRule;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = rule.condition === "occurs_at_times" ? Clock3 : rule.response === "subtle_insight" ? Bell : ListChecks;

  return (
    <article className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] bg-brand-gradient text-white">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-sm font-black leading-5 text-[var(--app-text)] sm:text-base sm:leading-6">{rule.title}</h2>
            <Pill className="border-[var(--app-border)] bg-[var(--app-secondary)] text-[var(--app-text-secondary)]">
              {spendingRuleConditionLabels[rule.condition]}
            </Pill>
          </div>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">{rule.description}</p>
        </div>
        <RuleToggle checked={rule.enabled} onChange={onToggle} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button type="button" variant="secondary" onClick={onEdit}>
          <Edit3 size={17} /> Edit
        </Button>
        <Button type="button" variant="danger" onClick={onDelete}>
          <Trash2 size={17} /> Delete
        </Button>
      </div>
    </article>
  );
}

function RuleToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={checked ? "Disable rule" : "Enable rule"}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors", checked ? "bg-[var(--brand-primary)]" : "bg-[var(--app-border)]")}
    >
      <span className={cn("block h-5 w-5 rounded-full bg-[var(--app-card)] shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

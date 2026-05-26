"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SettingsDetailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="sticky -top-4 z-20 mb-5 rounded-b-[1.35rem] border-b border-[var(--app-border)] bg-[color:rgb(245_247_246_/_0.94)] px-1 pb-4 pt-4 backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.9)] sm:-top-5 sm:mb-6 sm:pt-5 lg:-top-8">
      <Link href="/settings" className="mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-black text-[var(--brand-primary)] transition hover:bg-[var(--app-secondary)]">
        <ArrowLeft size={17} /> Settings
      </Link>
      <h1 className="text-[1.75rem] font-black leading-8 tracking-tight text-[var(--app-text)] sm:text-3xl sm:leading-9">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--app-text-secondary)]">{subtitle}</p> : null}
    </div>
  );
}

export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid w-full min-w-0 gap-2.5">
      {title ? <h2 className="px-2 text-[0.7rem] font-black uppercase leading-4 tracking-[0.18em] text-[var(--app-text-secondary)]">{title}</h2> : null}
      <div className="w-full min-w-0 overflow-hidden rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-card)] shadow-soft backdrop-blur">{children}</div>
    </section>
  );
}

export function SettingsRow({
  href,
  icon: Icon,
  title,
  subtitle,
  accessory,
  danger = false
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  danger?: boolean;
}) {
  const content = (
    <>
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] text-white", danger ? "bg-[var(--app-danger)]" : "bg-brand-gradient")}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-black leading-5 sm:text-base sm:leading-6", danger ? "text-[var(--app-danger)]" : "text-[var(--app-text)]")}>{title}</p>
        {subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-[var(--app-text-muted)] sm:text-sm sm:leading-6">{subtitle}</p> : null}
      </div>
      {accessory ?? (href ? <ChevronRight size={18} className="shrink-0 text-slate-300" /> : null)}
    </>
  );

  const className = "flex min-h-[4.25rem] items-center gap-3.5 border-b border-[var(--app-border)] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] sm:px-5";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function SettingsSwitchRow({
  icon: Icon,
  title,
  subtitle,
  accessory,
  checked,
  onChange,
  disabled = false
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-[4.5rem] w-full items-center gap-3.5 border-b border-[var(--app-border)] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] bg-brand-gradient text-white">
        <Icon size={18} />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-5 text-[var(--app-text)] sm:text-base sm:leading-6">{title}</span>
        {subtitle ? <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--app-text-muted)] sm:text-sm sm:leading-6">{subtitle}</span> : null}
      </span>
      {accessory}
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors duration-200", checked ? "bg-[var(--brand-primary)]" : "bg-[var(--app-border)]")}>
        <span className={cn("block h-5 w-5 rounded-full bg-[var(--app-card)] shadow transition-transform duration-200", checked && "translate-x-5")} />
      </span>
    </button>
  );
}

export function SettingsFeedback({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[90] flex w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-[rgb(31_209_165_/_0.2)] bg-[color:rgb(255_255_255_/_0.96)] px-3 py-2.5 text-sm font-black text-[var(--app-success)] shadow-float backdrop-blur-xl dark:bg-[color:rgb(18_26_31_/_0.96)]"
    >
      <CheckCircle2 size={17} /> {message}
    </div>
  );
}

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  working = false,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  working?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="app-bottom-nav fixed inset-0 z-[80] grid items-end justify-items-center bg-slate-950/30 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-[var(--app-card)] p-5 shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--app-text)]">{title}</h2>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--app-text-secondary)]">{body}</p>
          </div>
          <button type="button" onClick={onCancel} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--app-secondary)] text-[var(--app-text-muted)]">
            <X size={17} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={working}>
            Cancel
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={working}>
            {working ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

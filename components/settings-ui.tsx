"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SettingsDetailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="sticky -top-4 z-20 mb-4 rounded-b-[1.55rem] border-b border-[var(--app-border)] bg-[color:rgb(245_247_246_/_0.94)] px-6 pb-4 pt-[max(0.9rem,env(safe-area-inset-top))] backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.92)] sm:-top-5 sm:mb-6 sm:rounded-b-[1.9rem] sm:px-7 sm:pb-6 sm:pt-6 lg:-top-8">
      <Link href="/settings" className="-ml-2 mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-black text-[var(--brand-primary)] transition hover:bg-[var(--app-secondary)] sm:mb-6 sm:min-h-10 sm:text-sm">
        <ArrowLeft size={17} /> Settings
      </Link>
      <h1 className="text-[1.55rem] font-black leading-8 tracking-tight text-[var(--app-text)] sm:text-3xl sm:leading-10">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-xs font-bold leading-5 text-[var(--app-text-secondary)] sm:mt-3.5 sm:text-sm sm:leading-6">{subtitle}</p> : null}
    </div>
  );
}

export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid w-full min-w-0 gap-2">
      {title ? <h2 className="px-1 text-[0.68rem] font-black uppercase leading-4 tracking-[0.16em] text-[var(--app-text-secondary)]">{title}</h2> : null}
      <div className="w-full min-w-0 overflow-hidden rounded-[1.2rem] border border-[var(--app-border)] bg-[var(--app-card)] shadow-soft backdrop-blur sm:rounded-[1.35rem]">{children}</div>
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
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white sm:h-10 sm:w-10 sm:rounded-[0.9rem]", danger ? "bg-[var(--app-danger)]" : "bg-brand-gradient")}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className={cn("break-words text-sm font-black leading-5 [overflow-wrap:anywhere]", danger ? "text-[var(--app-danger)]" : "text-[var(--app-text)]")}>{title}</p>
        {subtitle ? <p className="mt-0.5 break-words text-[0.72rem] font-bold leading-4 text-[var(--app-text-muted)] [overflow-wrap:anywhere] sm:mt-1 sm:text-xs sm:leading-5">{subtitle}</p> : null}
      </div>
      <div className="flex min-w-max shrink-0 items-center justify-end">
        {accessory ?? (href ? <ChevronRight size={18} className="shrink-0 text-slate-300" /> : null)}
      </div>
    </>
  );

  const className = "grid min-h-[3.85rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--app-border)] px-3.5 py-3 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] sm:min-h-[4.25rem] sm:px-5 sm:py-3.5";
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
      className="grid min-h-[3.95rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--app-border)] px-3.5 py-3 text-left transition last:border-b-0 hover:bg-[var(--app-secondary)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[4.5rem] sm:px-5 sm:py-3.5"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white sm:h-10 sm:w-10 sm:rounded-[0.9rem]">
        <Icon size={17} />
      </div>
      <span className="min-w-0">
        <span className="block break-words text-sm font-black leading-5 text-[var(--app-text)] [overflow-wrap:anywhere]">{title}</span>
        {subtitle ? <span className="mt-0.5 block break-words text-[0.72rem] font-bold leading-4 text-[var(--app-text-muted)] [overflow-wrap:anywhere] sm:mt-1 sm:text-xs sm:leading-5">{subtitle}</span> : null}
      </span>
      <span className="flex min-w-max shrink-0 items-center justify-end gap-1.5">
        {accessory}
        <span className={cn("relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors duration-200", checked ? "bg-[var(--brand-primary)]" : "bg-[var(--app-border)]")}>
          <span className={cn("block h-5 w-5 rounded-full bg-[var(--app-card)] shadow transition-transform duration-200", checked && "translate-x-5")} />
        </span>
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
            {working ? "Working" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

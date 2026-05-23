"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CheckCircle2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SettingsDetailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="sticky -top-4 z-20 -mx-4 mb-4 border-b border-white/70 bg-[#f7faf7]/92 px-4 py-3 backdrop-blur-xl sm:-top-5 lg:-top-8">
      <Link href="/settings" className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-sm font-black text-[#327d6d] transition hover:bg-white">
        <ArrowLeft size={17} /> Settings
      </Link>
      <h1 className="text-2xl font-black tracking-tight text-[#10201c] sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-5 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      {title ? <h2 className="px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</h2> : null}
      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/88 shadow-soft backdrop-blur">{children}</div>
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
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white", danger ? "bg-rose-500" : "bg-[#327d6d]")}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-black sm:text-base", danger ? "text-rose-700" : "text-[#10201c]")}>{title}</p>
        {subtitle ? <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-slate-500 sm:text-sm sm:leading-5">{subtitle}</p> : null}
      </div>
      {accessory ?? (href ? <ChevronRight size={18} className="shrink-0 text-slate-300" /> : null)}
    </>
  );

  const className = "flex min-h-14 items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[#f7faf7]";
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
      className="flex min-h-16 w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[#f7faf7] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#327d6d] text-white">
        <Icon size={18} />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#10201c] sm:text-base">{title}</span>
        {subtitle ? <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-500 sm:text-sm sm:leading-5">{subtitle}</span> : null}
      </span>
      {accessory}
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors duration-200", checked ? "bg-[#183f36]" : "bg-slate-300")}>
        <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200", checked && "translate-x-5")} />
      </span>
    </button>
  );
}

export function SettingsFeedback({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700 shadow-soft">
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
    <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#10201c]">{title}</h2>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-600">{body}</p>
          </div>
          <button type="button" onClick={onCancel} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
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

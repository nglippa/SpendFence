import { cloneElement, forwardRef, isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "w-full min-w-0 rounded-[1.45rem] border border-[color:rgb(15_23_42_/_0.055)] bg-[color:rgb(255_255_255_/_0.74)] p-[1.125rem] shadow-[0_14px_38px_rgb(11_17_20_/_0.055)] backdrop-blur-xl motion-safe:animate-[surface-rise_360ms_ease-out_both] dark:border-white/10 dark:bg-[color:rgb(18_26_31_/_0.74)] dark:shadow-[0_16px_42px_rgb(0_0_0_/_0.22)] sm:rounded-[1.75rem] sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2",
    size === "sm" && "min-h-10 px-3 text-xs sm:text-sm",
    size === "md" && "px-3.5 py-2 text-sm sm:px-4",
    size === "lg" && "min-h-11 px-4 text-sm sm:min-h-14 sm:px-5 sm:text-base",
    variant === "primary" && "bg-brand-gradient text-white shadow-[0_14px_30px_rgb(24_184_137_/_0.20)] hover:brightness-[1.03] dark:text-[#0B1114]",
    variant === "secondary" && "bg-[color:rgb(24_184_137_/_0.09)] text-[var(--brand-primary)] hover:bg-[color:rgb(24_184_137_/_0.13)]",
    variant === "ghost" && "text-[var(--app-text-secondary)] hover:bg-[var(--app-secondary)]",
    variant === "danger" && "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-[rgb(255_107_107_/_0.13)] dark:text-[#FF6B6B]",
    className
  );

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, { className: cn(classes, children.props.className) });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "min-h-11 w-full rounded-2xl border border-[color:rgb(15_23_42_/_0.065)] bg-[color:rgb(255_255_255_/_0.78)] px-3.5 text-sm font-bold text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] dark:border-white/10 dark:bg-white/[0.055] sm:min-h-12 sm:px-4",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full rounded-2xl border border-[color:rgb(15_23_42_/_0.065)] bg-[color:rgb(255_255_255_/_0.78)] px-3.5 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] dark:border-white/10 dark:bg-white/[0.055] sm:min-h-24 sm:px-4",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-2xl border border-[color:rgb(15_23_42_/_0.065)] bg-[color:rgb(255_255_255_/_0.78)] px-3.5 text-sm font-black text-[var(--app-text)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] dark:border-white/10 dark:bg-white/[0.055] sm:min-h-12 sm:px-4",
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-[var(--app-text-secondary)] sm:text-sm">
      {label}
      {children}
    </label>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-black leading-none sm:px-3 sm:text-xs", className)}>{children}</span>;
}

export function PageHeader({ kicker, title, body, action }: { kicker: string; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex w-full min-w-0 flex-col gap-4 md:mb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">{kicker}</p>
        <h1 className="mt-1.5 text-[1.7rem] font-black leading-8 tracking-tight text-[var(--app-text)] sm:text-3xl sm:leading-10 md:text-4xl">{title}</h1>
        {body ? <p className="mt-1.5 max-w-2xl break-words text-sm font-semibold leading-5 text-[var(--app-text-secondary)] [overflow-wrap:anywhere] sm:mt-2 sm:leading-6">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ percent, color = "#18B889", compact = false }: { percent: number; color?: string; compact?: boolean }) {
  const width = Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 125) : 0;
  return (
    <div className={cn("overflow-hidden rounded-full bg-[var(--app-secondary)]", compact ? "h-1.5 sm:h-2" : "h-2.5 sm:h-3")}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid place-items-center rounded-[1.35rem] bg-[color:rgb(238_244_241_/_0.70)] px-4 text-center dark:bg-white/[0.04] sm:rounded-[1.6rem]", compact ? "py-4" : "py-8 sm:py-10")}>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:rgb(255_255_255_/_0.74)] text-[var(--brand-primary)] shadow-[0_10px_24px_rgb(11_17_20_/_0.055)] dark:bg-white/[0.07]">
        <Icon size={20} />
      </div>
      <h2 className="mt-3 text-base font-black text-[var(--app-text)] sm:text-lg">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm font-semibold leading-5 text-[var(--app-text-secondary)] sm:leading-6">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

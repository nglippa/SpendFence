import { cloneElement, forwardRef, isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("w-full min-w-0 rounded-[1.15rem] border border-[var(--app-border)] bg-[var(--app-card)] p-3.5 shadow-soft backdrop-blur sm:rounded-[1.55rem] sm:p-5", className)}>{children}</section>;
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
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-2xl",
    size === "sm" && "min-h-10 px-3 text-xs sm:text-sm",
    size === "md" && "px-3.5 py-2 text-sm sm:px-4",
    size === "lg" && "min-h-11 px-4 text-sm sm:min-h-14 sm:px-5 sm:text-base",
    variant === "primary" && "bg-brand-gradient text-white shadow-float hover:brightness-[1.03] dark:text-[#0B1114]",
    variant === "secondary" && "bg-[var(--app-secondary)] text-[var(--brand-primary)] hover:brightness-[0.98]",
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
      "min-h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3.5 text-sm font-bold text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-12 sm:rounded-2xl sm:px-4",
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
      "min-h-20 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3.5 py-3 text-sm font-bold text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-24 sm:rounded-2xl sm:px-4",
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
        "min-h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3.5 text-sm font-black text-[var(--app-text)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-12 sm:rounded-2xl sm:px-4",
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
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-black leading-5 sm:px-2.5 sm:py-1 sm:text-xs", className)}>{children}</span>;
}

export function PageHeader({ kicker, title, body, action }: { kicker: string; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex w-full min-w-0 flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">{kicker}</p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[var(--app-text)] sm:text-3xl md:text-4xl">{title}</h1>
        {body ? <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-5 text-[var(--app-text-secondary)] sm:mt-2 sm:leading-6">{body}</p> : null}
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
    <div className={cn("grid place-items-center rounded-xl bg-[var(--app-secondary)] px-4 text-center sm:rounded-2xl", compact ? "py-4" : "py-8 sm:py-10")}>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--app-card)] text-[var(--brand-primary)] shadow-soft">
        <Icon size={20} />
      </div>
      <h2 className="mt-3 text-base font-black text-[var(--app-text)] sm:text-lg">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm font-semibold leading-5 text-[var(--app-text-secondary)] sm:leading-6">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

import { cloneElement, forwardRef, isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-[1.15rem] border border-[var(--glass-border)] [background:var(--glass-section-bg)] p-4 shadow-[var(--glass-shadow)] backdrop-blur-[18px] motion-safe:animate-[surface-rise_360ms_ease-out_both] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--glass-edge)] after:pointer-events-none after:absolute after:inset-0 after:[background:var(--glass-reflection)] after:opacity-65 after:mix-blend-screen sm:p-5",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
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
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[0.85rem] font-black transition duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2",
    size === "sm" && "min-h-9 px-2.5 text-xs sm:text-sm",
    size === "md" && "px-3.5 py-2 text-sm sm:px-4",
    size === "lg" && "min-h-11 px-4 text-sm sm:min-h-12 sm:px-5 sm:text-base",
    variant === "primary" && "border border-[rgb(178_230_211_/_0.16)] bg-brand-gradient text-[#06110d] shadow-[0_12px_26px_rgb(0_0_0_/_0.18),0_2px_14px_rgb(95_164_142_/_0.10),inset_0_1px_0_rgb(255_255_255_/_0.28)] hover:brightness-[1.07]",
    variant === "secondary" && "border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] text-[var(--brand-secondary)] shadow-[inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_rgb(255_255_255_/_0.018)] backdrop-blur-[14px] hover:[background:var(--glass-focused-bg)]",
    variant === "ghost" && "text-[var(--app-text-secondary)] hover:bg-[color:rgb(255_255_255_/_0.060)]",
    variant === "danger" && "border border-[rgb(207_113_109_/_0.16)] bg-[rgb(207_113_109_/_0.12)] text-[var(--app-danger)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] hover:bg-[rgb(207_113_109_/_0.18)]",
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
      "min-h-10 w-full rounded-[0.85rem] border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] px-3.5 text-sm font-bold text-[var(--app-text)] shadow-[inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_rgb(255_255_255_/_0.018)] backdrop-blur-[14px] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[rgb(111_183_165_/_0.30)] focus:[background:var(--glass-focused-bg)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-11 sm:px-4",
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
      "min-h-20 w-full rounded-[0.85rem] border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] px-3.5 py-3 text-sm font-bold text-[var(--app-text)] shadow-[inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_rgb(255_255_255_/_0.018)] backdrop-blur-[14px] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[rgb(111_183_165_/_0.30)] focus:[background:var(--glass-focused-bg)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-24 sm:px-4",
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
        "min-h-10 w-full rounded-[0.85rem] border border-[var(--glass-border)] [background:var(--glass-interactive-bg)] px-3.5 text-sm font-black text-[var(--app-text)] shadow-[inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_rgb(255_255_255_/_0.018)] backdrop-blur-[14px] outline-none transition focus:border-[rgb(111_183_165_/_0.30)] focus:[background:var(--glass-focused-bg)] focus:ring-4 focus:ring-[var(--app-ring)] sm:min-h-11 sm:px-4",
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
  return <span className={cn("inline-flex min-h-6 items-center gap-1 rounded-[0.72rem] border px-2.5 py-0.5 text-[0.68rem] font-black leading-none shadow-[inset_0_1px_0_rgb(255_255_255_/_0.10)] backdrop-blur-[10px] sm:text-xs", className)}>{children}</span>;
}

export function PageHeader({ kicker, title, body, action }: { kicker: string; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex w-full min-w-0 flex-col gap-4 px-0.5 md:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="section-kicker text-[var(--brand-primary)]">{kicker}</p>
        <h1 className="mt-1.5 text-[1.72rem] font-black leading-8 tracking-tight text-[var(--app-text)] sm:text-3xl sm:leading-10 md:text-4xl">{title}</h1>
        {body ? <p className="mt-1.5 max-w-2xl break-words text-sm font-semibold leading-5 text-[var(--app-text-secondary)] [overflow-wrap:anywhere] sm:mt-2 sm:leading-6">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ percent, color = "var(--app-success)", compact = false }: { percent: number; color?: string; compact?: boolean }) {
  const width = Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 125) : 0;
  return (
    <div className={cn("overflow-hidden rounded-full bg-[rgb(255_255_255_/_0.090)] shadow-[inset_0_1px_2px_rgb(0_0_0_/_0.22),inset_0_1px_0_rgb(255_255_255_/_0.10)]", compact ? "h-1.5 sm:h-2" : "h-2 sm:h-2.5")}>
      <div className="h-full rounded-full shadow-[inset_0_1px_0_rgb(255_255_255_/_0.22)] transition-[width] duration-500 ease-out" style={{ width: `${width}%`, background: color }} />
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
    <div className={cn("grid place-items-center rounded-[1.05rem] border border-[var(--glass-hairline)] [background:var(--glass-interactive-bg)] px-4 text-center shadow-[inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_rgb(255_255_255_/_0.018)] backdrop-blur-[14px]", compact ? "py-4" : "py-8 sm:py-10")}>
      <div className="grid h-10 w-10 place-items-center rounded-[0.85rem] bg-[color:rgb(255_255_255_/_0.070)] text-[var(--brand-secondary)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14)]">
        <Icon size={20} />
      </div>
      <h2 className="mt-3 text-base font-black text-[var(--app-text)] sm:text-lg">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm font-semibold leading-5 text-[var(--app-text-secondary)] sm:leading-6">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

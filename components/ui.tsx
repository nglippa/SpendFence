import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-[1.15rem] border border-white/80 bg-white/88 p-3.5 shadow-soft backdrop-blur sm:rounded-[1.55rem] sm:p-5", className)}>{children}</section>;
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
    variant === "primary" && "bg-[#183f36] text-white shadow-float hover:bg-[#102e28]",
    variant === "secondary" && "bg-[#e9f3ee] text-[#183f36] hover:bg-[#dcebe5]",
    variant === "ghost" && "text-slate-600 hover:bg-slate-100",
    variant === "danger" && "bg-rose-50 text-rose-700 hover:bg-rose-100",
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
      "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#58c6a8] focus:ring-4 focus:ring-[#58c6a8]/16 sm:min-h-12 sm:rounded-2xl sm:px-4",
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
      "min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#58c6a8] focus:ring-4 focus:ring-[#58c6a8]/16 sm:min-h-24 sm:rounded-2xl sm:px-4",
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
        "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-black text-slate-950 outline-none transition focus:border-[#58c6a8] focus:ring-4 focus:ring-[#58c6a8]/16 sm:min-h-12 sm:rounded-2xl sm:px-4",
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-700 sm:text-sm">
      {label}
      {children}
    </label>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-black leading-5 sm:px-2.5 sm:py-1 sm:text-xs", className)}>{children}</span>;
}

export function PageHeader({ kicker, title, body, action }: { kicker: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">{kicker}</p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#10201c] sm:text-3xl md:text-4xl">{title}</h1>
        {body ? <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-5 text-slate-600 sm:mt-2 sm:leading-6">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ percent, color = "#58c6a8" }: { percent: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 sm:h-3">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(percent, 125)}%`, background: color }} />
    </div>
  );
}

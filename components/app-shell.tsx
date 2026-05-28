"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Bell, ChartPie, Home, ListChecks, LogOut, PlusCircle, ScanLine, Settings, TestTube2, WalletCards } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth";
import { SpendFenceProvider, useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/categories", label: "Budgets", icon: WalletCards },
  { href: "/add-purchase", label: "Add", icon: PlusCircle },
  { href: "/receipt-scanner", label: "Scan", icon: ScanLine },
  { href: "/transaction-review", label: "Review", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings }
];

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/add-purchase", label: "Add", icon: PlusCircle },
  { href: "/categories", label: "Budgets", icon: WalletCards },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings }
];

const publicRoutes = ["/", "/demo", "/philosophy", "/adaptive-ai", "/features", "/security", "/pricing", "/premium", "/login", "/signup", "/forgot-password"];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, enterDemoMode } = useAuth();
  const isPublic = publicRoutes.includes(pathname) || pathname.startsWith("/demo/");

  useEffect(() => {
    if (loading) return;
    const isDemoQueryLaunch = pathname === "/dashboard" && hasDemoQuery();
    const lockedDemoLaunch = isDemoQueryLaunch || hasLockedDemoCookie();
    if (lockedDemoLaunch && (!user?.isDemo || !user.demoLocked)) {
      enterDemoMode({ locked: true });
      if (isDemoQueryLaunch) router.replace("/dashboard");
      return;
    }
    if (!user && !isPublic) router.replace("/login");
    if (user && ["/login", "/signup", "/forgot-password"].includes(pathname)) router.replace("/onboarding");
  }, [enterDemoMode, isPublic, loading, pathname, router, user]);

  if (isPublic) return <>{children}</>;
  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 text-center shadow-soft">
          <BrandLogo className="mx-auto h-16 w-auto" />
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">SpendFence</p>
          <p className="mt-2 font-black text-[var(--app-text)]">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <SpendFenceProvider userId={user.id} demoLocked={user.demoLocked ?? user.isDemo}>
      <InnerShell pathname={pathname}>{children}</InnerShell>
    </SpendFenceProvider>
  );
}

function hasLockedDemoCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === "spendfence-demo-locked-session-v1=true" || item === "spendfence-demo-session-v1=true");
}

function hasDemoQuery() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "true";
}

function InnerShell({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const router = useRouter();
  const auth = useAuth();
  const { demoDataEnabled, demoModeLocked, notifications, onboardingProfile, ready } = useSpendFence();
  const unread = notifications.filter((item) => !item.read).length;
  const isOnboarding = pathname.startsWith("/onboarding");

  async function leaveDemo(nextPath: "/" | "/signup") {
    await auth.signOut();
    router.push(nextPath);
  }

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (!onboardingProfile.completed && !isOnboarding) router.replace("/onboarding");
    if (onboardingProfile.completed && isOnboarding) router.replace("/dashboard");
  }, [isOnboarding, onboardingProfile.completed, ready, router]);

  if (isOnboarding) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[color:rgb(245_247_246_/_0.86)] pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.88)]">
        <div className="app-shell-frame flex items-center justify-between gap-3 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo className="h-10 w-auto sm:h-11" />
            <div>
              <p className="text-base font-black leading-tight text-[var(--app-text)] sm:text-lg">SpendFence</p>
              <p className="text-xs font-bold text-[var(--app-text-muted)]">Monthly fences</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </nav>
          <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[var(--app-card)] text-[var(--app-text-secondary)] shadow-soft sm:h-11 sm:w-11">
            <Bell size={19} />
            {unread ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
          </Link>
        </div>
      </header>

      <main className="app-shell-frame overflow-x-clip pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:pt-5 lg:pb-8 lg:pt-8">
        <div className="relative min-h-[calc(100dvh-9rem)] overflow-x-clip">
          {auth.isDeveloper ? (
            <div className="mb-4 inline-flex min-h-8 items-center rounded-full border border-sky-100 bg-sky-50 px-3 text-xs font-black text-sky-700 shadow-soft sm:mb-5">
              Developer Preview: {auth.planLabel}
            </div>
          ) : null}
          {demoDataEnabled ? (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[color:rgb(24_184_137_/_0.20)] bg-[color:rgb(24_184_137_/_0.10)] px-3.5 py-3 shadow-soft sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[color:rgb(24_184_137_/_0.14)] text-[var(--brand-primary)]">
                  <TestTube2 size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[var(--app-text)]">Demo Mode</p>
                  <p className="text-xs font-bold leading-5 text-[var(--app-text-muted)]">
                    Sample data only{demoModeLocked ? ". Create an account to use SpendFence with your own data." : "."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => leaveDemo("/signup")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3 text-xs font-black text-white shadow-soft transition hover:-translate-y-0.5 dark:text-[#071012]"
                >
                  Create Account <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => leaveDemo("/")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 text-xs font-black text-[var(--app-text-secondary)] transition hover:bg-[var(--app-secondary)]"
                >
                  <LogOut size={14} /> Exit Demo
                </button>
              </div>
            </div>
          ) : null}
          <div className="w-full">{children}</div>
        </div>
      </main>

      <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] bg-[color:rgb(255_255_255_/_0.95)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(11,17,20,.08)] backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.95)] lg:hidden">
        <div className="mx-auto grid w-full max-w-lg grid-cols-5 gap-1.5">
          {mobileNav.map((item) => (
            <MobileNavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon: Icon, pathname }: (typeof nav)[number] & { pathname: string }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-2xl px-3 text-sm font-black transition",
        active ? "bg-brand-gradient text-white shadow-soft dark:text-[#0B1114]" : "text-[var(--app-text-secondary)] hover:bg-[var(--app-secondary)]"
      )}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon, pathname }: (typeof mobileNav)[number] & { pathname: string }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[0.625rem] font-black leading-none transition",
        active ? "bg-brand-gradient text-white shadow-soft dark:text-[#0B1114]" : "text-[var(--app-text-muted)] hover:bg-[var(--app-secondary)]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={17} strokeWidth={2.35} />
      <span className="max-w-full text-center leading-none">{label}</span>
    </Link>
  );
}

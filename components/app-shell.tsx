"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChartPie, Home, ListChecks, PlusCircle, ScanLine, Settings, WalletCards } from "lucide-react";
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

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/pricing"];
const pageTransition = {
  type: "tween" as const,
  ease: [0.22, 1, 0.36, 1] as const,
  duration: 0.18
};
const pageVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 }
};
const SWIPE_THRESHOLD = 40;
const SWIPE_AXIS_LOCK_THRESHOLD = 16;
const SWIPE_VERTICAL_RATIO = 1.5;
const SWIPE_LOCK_MS = 360;

type SwipeState = {
  active: boolean;
  axis: "undecided" | "x" | "y";
  startX: number;
  startY: number;
  lockY: number;
};

type ScrollLockSnapshot = {
  bodyOverflow: string;
  bodyTouchAction: string;
  htmlOverscrollBehaviorY: string;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublic = publicRoutes.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) router.replace("/login");
    if (user && ["/login", "/signup", "/forgot-password"].includes(pathname)) router.replace("/onboarding");
  }, [isPublic, loading, pathname, router, user]);

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
    <SpendFenceProvider userId={user.id}>
      <InnerShell pathname={pathname}>{children}</InnerShell>
    </SpendFenceProvider>
  );
}

function InnerShell({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const router = useRouter();
  const { notifications, onboardingProfile, ready } = useSpendFence();
  const swipe = useRef<SwipeState>({ active: false, axis: "undecided", startX: 0, startY: 0, lockY: 0 });
  const swipeLockedUntil = useRef(0);
  const scrollLock = useRef<ScrollLockSnapshot | null>(null);
  const releaseScrollLockTimer = useRef<number | null>(null);
  const unread = notifications.filter((item) => !item.read).length;
  const isOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    return () => releaseSwipeScrollLock(0);
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, pageTransition.duration * 1000);

    return () => window.clearTimeout(resetTimer);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (!onboardingProfile.completed && !isOnboarding) router.replace("/onboarding");
    if (onboardingProfile.completed && isOnboarding) router.replace("/dashboard");
  }, [isOnboarding, onboardingProfile.completed, ready, router]);

  if (isOnboarding) {
    return <div className="min-h-dvh">{children}</div>;
  }

  function beginSwipe(x: number, y: number, target: EventTarget | null) {
    if (isSwipeNavigationIgnored(target) || window.innerWidth >= 1024 || performance.now() < swipeLockedUntil.current) {
      resetSwipe();
      return;
    }

    swipe.current = {
      active: true,
      axis: "undecided",
      startX: x,
      startY: y,
      lockY: window.scrollY
    };
  }

  function updateSwipe(x: number, y: number, preventDefault?: () => void) {
    const state = swipe.current;
    if (!state.active) return;

    const dx = x - state.startX;
    const dy = y - state.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (state.axis === "undecided") {
      if (absX < SWIPE_AXIS_LOCK_THRESHOLD && absY < SWIPE_AXIS_LOCK_THRESHOLD) return;
      if (absX > SWIPE_AXIS_LOCK_THRESHOLD && absX > absY * SWIPE_VERTICAL_RATIO) {
        state.axis = "x";
        lockSwipeScroll();
      } else if (absY > absX) {
        state.axis = "y";
        state.active = false;
        return;
      }
    }

    if (state.axis === "x") {
      preventDefault?.();
      if (Math.abs(window.scrollY - state.lockY) > 1) {
        window.scrollTo({ top: state.lockY, left: 0, behavior: "auto" });
      }
    }
  }

  function finishSwipe(x: number, y: number, target: EventTarget | null) {
    const state = { ...swipe.current };
    resetSwipe();
    if (!state.active || state.axis !== "x" || performance.now() < swipeLockedUntil.current || isSwipeNavigationIgnored(target)) {
      releaseSwipeScrollLock(0);
      return;
    }

    const dx = x - state.startX;
    const dy = y - state.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX <= SWIPE_THRESHOLD || absX <= absY * SWIPE_VERTICAL_RATIO) {
      releaseSwipeScrollLock(0);
      return;
    }

    const currentIndex = mobileNav.findIndex((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    if (currentIndex < 0) {
      releaseSwipeScrollLock(0);
      return;
    }

    const direction = dx < 0 ? 1 : -1;
    const targetIndex = Math.min(mobileNav.length - 1, Math.max(0, currentIndex + direction));
    if (targetIndex === currentIndex) {
      releaseSwipeScrollLock(0);
      return;
    }

    swipeLockedUntil.current = performance.now() + SWIPE_LOCK_MS;
    router.push(mobileNav[targetIndex].href);
    releaseSwipeScrollLock(SWIPE_LOCK_MS);
  }

  function cancelSwipe() {
    resetSwipe();
    releaseSwipeScrollLock(0);
  }

  function resetSwipe() {
    swipe.current = { active: false, axis: "undecided", startX: 0, startY: 0, lockY: 0 };
  }

  function lockSwipeScroll() {
    if (scrollLock.current) return;
    if (releaseScrollLockTimer.current) {
      window.clearTimeout(releaseScrollLockTimer.current);
      releaseScrollLockTimer.current = null;
    }

    scrollLock.current = {
      bodyOverflow: document.body.style.overflow,
      bodyTouchAction: document.body.style.touchAction,
      htmlOverscrollBehaviorY: document.documentElement.style.overscrollBehaviorY
    };
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overscrollBehaviorY = "none";
  }

  function releaseSwipeScrollLock(delay: number) {
    if (releaseScrollLockTimer.current) {
      window.clearTimeout(releaseScrollLockTimer.current);
      releaseScrollLockTimer.current = null;
    }

    releaseScrollLockTimer.current = window.setTimeout(() => {
      if (!scrollLock.current) return;
      document.body.style.overflow = scrollLock.current.bodyOverflow;
      document.body.style.touchAction = scrollLock.current.bodyTouchAction;
      document.documentElement.style.overscrollBehaviorY = scrollLock.current.htmlOverscrollBehaviorY;
      scrollLock.current = null;
      releaseScrollLockTimer.current = null;
    }, delay);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "pen") return;
    beginSwipe(event.clientX, event.clientY, event.target);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "pen") return;
    updateSwipe(event.clientX, event.clientY, () => event.preventDefault());
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "pen") return;
    finishSwipe(event.clientX, event.clientY, event.target);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    beginSwipe(touch.clientX, touch.clientY, event.target);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    updateSwipe(touch.clientX, touch.clientY, () => event.preventDefault());
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    if (!touch) {
      cancelSwipe();
      return;
    }
    finishSwipe(touch.clientX, touch.clientY, event.target);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[color:rgb(245_247_246_/_0.86)] pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.88)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
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

      <main className="mx-auto w-full max-w-7xl overflow-x-clip px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:pt-5 lg:pb-8 lg:pt-8">
        <div className="relative min-h-[calc(100dvh-9rem)] overflow-x-clip">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full will-change-transform"
              style={{ transformOrigin: "50% 0%" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={cancelSwipe}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={cancelSwipe}
            >
            {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] bg-[color:rgb(255_255_255_/_0.95)] px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(11,17,20,.08)] backdrop-blur-xl dark:bg-[color:rgb(11_17_20_/_0.95)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1.5">
          {mobileNav.map((item) => (
            <MobileNavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function isSwipeNavigationIgnored(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        "input",
        "textarea",
        "select",
        "button",
        "a",
        "canvas",
        "video",
        "audio",
        "[role='dialog']",
        "[data-swipe-nav-ignore='true']",
        "[data-carousel='true']"
      ].join(",")
    )
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
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

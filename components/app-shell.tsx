"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChartPie, Home, ListChecks, PlusCircle, ScanLine, Settings, Tags } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SpendFenceProvider, useSpendFence } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/add-purchase", label: "Add", icon: PlusCircle },
  { href: "/receipt-scanner", label: "Scan", icon: ScanLine },
  { href: "/transaction-review", label: "Review", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings }
];

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/pricing"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublic = publicRoutes.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) router.replace("/login");
    if (user && ["/login", "/signup", "/forgot-password"].includes(pathname)) router.replace("/dashboard");
  }, [isPublic, loading, pathname, router, user]);

  if (isPublic) return <>{children}</>;
  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="rounded-3xl border border-white/80 bg-white/88 p-5 text-center shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#327d6d]">SpendFence</p>
          <p className="mt-2 font-black text-[#10201c]">Checking your session...</p>
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
  const { notifications } = useSpendFence();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7faf7]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-11 w-11 rounded-2xl shadow-soft" />
            <div>
              <p className="text-lg font-black leading-tight text-[#10201c]">SpendFence</p>
              <p className="text-xs font-bold text-slate-500">Monthly guardrails</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </nav>
          <Link href="/notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-soft">
            <Bell size={19} />
            {unread ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 md:py-8">
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/94 px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 shadow-[0_-10px_35px_rgba(32,46,61,.12)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-7 gap-1">
          {nav.map((item) => (
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
        active ? "bg-[#183f36] text-white shadow-soft" : "text-slate-600 hover:bg-white"
      )}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon, pathname }: (typeof nav)[number] & { pathname: string }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "grid min-h-14 place-items-center rounded-2xl text-[0.65rem] font-black transition",
        active ? "bg-[#183f36] text-white" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  );
}

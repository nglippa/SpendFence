"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BellRing, ChartPie, CheckCircle2, LockKeyhole, ReceiptText, ScanLine, Shield } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, Pill, ProgressBar } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-11 w-auto" />
          <span className="text-lg font-black text-[#10201c]">SpendFence</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
          <a href="#features" className="hover:text-[#10201c]">Features</a>
          <a href="#reports" className="hover:text-[#10201c]">Reports</a>
          <Link href="/pricing" className="hover:text-[#10201c]">Pricing</Link>
          <Link href="/login" className="hover:text-[#10201c]">Log in</Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/signup">Start</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-8 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Pill className="border-[#cfe8de] bg-white text-[#327d6d]">
              <Shield size={13} className="mr-1" /> Calm spending guardrails
            </Pill>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.96] tracking-tight text-[#10201c] sm:text-6xl lg:text-7xl">
              Simple budgets that tell you when to pause.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              SpendFence helps you set monthly category limits, log purchases in seconds, scan receipt drafts, and see soft or hard spending warnings without bank-link clutter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create account <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.45 }}>
            <Card className="p-0">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#327d6d]">May budget</p>
                    <h2 className="text-2xl font-black">Fence status</h2>
                  </div>
                  <Pill className="border-emerald-100 bg-emerald-50 text-emerald-700">Safe</Pill>
                </div>
              </div>
              <div className="grid gap-4 p-5">
                {[
                  ["Groceries", 68, "#18B889", "Safe"],
                  ["Eating out", 86, "#F5B942", "Warning"],
                  ["Kids", 101, "#F05D5E", "Limit reached"]
                ].map(([name, percent, color, status]) => (
                  <div key={name} className="rounded-3xl bg-[#f7faf7] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-black">{name}</span>
                      <span className="text-sm font-black text-slate-500">{status}</span>
                    </div>
                    <ProgressBar percent={Number(percent)} color={String(color)} />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        <section id="features" className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-3">
          {[
            { icon: ReceiptText, title: "Fast purchase logging", body: "Amount, category, merchant, date, notes, and receipt image." },
            { icon: ScanLine, title: "Scan Receipt", body: "Analyze a receipt and review category suggestions before saving." },
            { icon: BellRing, title: "In-app warnings", body: "50%, soft warning, limit reached, daily summary, and weekly check-in UI." }
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-black">{feature.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{feature.body}</p>
              </Card>
            );
          })}
        </section>

        <section id="reports" className="mx-auto max-w-7xl px-4 py-12">
          <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#327d6d]">Reports without clutter</p>
              <h2 className="mt-2 text-3xl font-black">See what matters, skip the financial noise.</h2>
              <div className="mt-4 grid gap-2 text-sm font-black text-slate-700 sm:grid-cols-2">
                {["Spending by category", "Biggest purchases", "Close to limit", "Month-to-date trend"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-[#58c6a8]" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                <ChartPie size={18} /> Start tracking
              </Link>
            </Button>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <Card className="bg-brand-gradient text-white">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a8ead9]">Future ready</p>
                <h2 className="mt-2 text-3xl font-black">Bank sync and real OCR can come later.</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
                  The MVP keeps purchases, categories, receipts, prompts, and notifications in local models that can map to Plaid imports or OCR output later.
                </p>
              </div>
              <LockKeyhole className="text-[#a8ead9]" size={44} />
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

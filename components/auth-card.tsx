"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button, Card, Field, Input, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";

type AuthMode = "login" | "signup" | "forgot";
type AuthResult = { error?: string; message?: string };

const copy = {
  login: {
    kicker: "Welcome back",
    title: "Log in to SpendFence",
    body: "Your budget guardrails stay private and ready when you come back.",
    button: "Log in",
    foot: "No account yet?",
    footHref: "/signup",
    footLink: "Create one"
  },
  signup: {
    kicker: "Start calm",
    title: "Create your account",
    body: "Set up SpendFence now. Local-first budget data stays in place for this MVP.",
    button: "Create account",
    foot: "Already have an account?",
    footHref: "/login",
    footLink: "Log in"
  },
  forgot: {
    kicker: "Reset",
    title: "Forgot your password?",
    body: "Enter your email and we’ll send a reset link if Supabase auth is configured.",
    button: "Send reset link",
    foot: "Remembered it?",
    footHref: "/login",
    footLink: "Back to login"
  }
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthCard({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const content = copy[mode];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const result: AuthResult =
      mode === "login"
        ? await auth.signIn(email, password)
        : mode === "signup"
          ? await auth.signUp(email, password)
          : await auth.resetPassword(email);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "forgot") {
      setMessage(result.message ?? "Reset email sent.");
      return;
    }

    if (mode === "signup") {
      setMessage(result.message ?? "Account created. You can log in once your email is confirmed.");
      return;
    }

    router.replace("/dashboard");
  }

  function enterDemo() {
    auth.enterDemoMode();
    router.replace("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-6 flex w-max items-center gap-3">
          <img src="/icon.svg" alt="" className="h-12 w-12 rounded-2xl shadow-soft" />
          <span className="text-xl font-black text-[#10201c]">SpendFence</span>
        </Link>

        <Card className="p-5 sm:p-6">
          <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">
            <ShieldCheck size={13} className="mr-1" /> {content.kicker}
          </Pill>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#10201c]">{content.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{content.body}</p>

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input className="pl-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </Field>

            {mode !== "forgot" ? (
              <Field label="Password">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    className="pl-11"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </Field>
            ) : null}

            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Working..." : content.button}
              <ArrowRight size={18} />
            </Button>
          </form>

          {mode === "login" && auth.demoModeAvailable ? (
            <div className="mt-4 rounded-3xl border border-dashed border-[#cfe8de] bg-[#f7faf7] p-4">
              <p className="text-sm font-black text-[#10201c]">Demo Mode</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Supabase keys are missing in development. Use local demo data without production authentication.
              </p>
              <Button type="button" variant="secondary" className="mt-3 w-full" onClick={enterDemo}>
                Enter Demo Mode
              </Button>
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
            <span>{content.foot}</span>
            <Link href={content.footHref} className="text-[#327d6d] hover:text-[#10201c]">
              {content.footLink}
            </Link>
          </div>

          {mode === "login" ? (
            <Link href="/forgot-password" className="mt-3 block text-sm font-bold text-slate-500 hover:text-[#10201c]">
              Forgot password?
            </Link>
          ) : null}
        </Card>
      </div>
    </main>
  );
}

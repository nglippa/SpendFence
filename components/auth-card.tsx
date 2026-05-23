"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, Field, Input, Pill } from "@/components/ui";
import { MfaChallenge, MfaFactor, SignInResult, useAuth } from "@/lib/auth";
import { featureFlags } from "@/lib/feature-flags";

type AuthMode = "login" | "signup" | "forgot";
type AuthResult = SignInResult & { message?: string };

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
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const content = copy[mode];
  const smsMfaEnabled = featureFlags.ENABLE_SMS_MFA;
  const activeFactor = useMemo(
    () => mfaFactors.find((factor) => factor.id === mfaChallenge?.factorId) ?? null,
    [mfaChallenge?.factorId, mfaFactors]
  );
  const passwordChecks = getPasswordChecks(password);
  const passwordScore = passwordChecks.filter((check) => check.met).length;
  const passwordStrength = getPasswordStrength(password, passwordScore);

  useEffect(() => {
    // TODO(sms-mfa): Timer is retained for future SMS MFA but remains inert while
    // ENABLE_SMS_MFA is false.
    if (!smsMfaEnabled || resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds, smsMfaEnabled]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mfaChallenge) {
      await verifyMfa();
      return;
    }

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

    if ("mfaRequired" in result && result.mfaRequired && result.mfa) {
      setMfaFactors(result.mfa.factors);
      setMfaChallenge(result.mfa.challenge);
      setResendSeconds(smsMfaEnabled && result.mfa.challenge.type === "phone" ? 45 : 0);
      setMessage(smsMfaEnabled && result.mfa.challenge.type === "phone" ? "We sent a verification code to your phone." : "");
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

  async function verifyMfa() {
    if (!mfaChallenge) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    const result = await auth.verifyMfaChallenge(mfaChallenge, mfaCode, trustDevice);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace("/dashboard");
  }

  async function switchMfaFactor(factor: MfaFactor) {
    if (factor.type === "phone" && !smsMfaEnabled) {
      setError("SMS MFA is planned for a future update. Use your authenticator app to continue.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    setMfaCode("");

    const result = await auth.startMfaChallenge(factor);
    setSubmitting(false);

    if (result.error || !result.challenge) {
      setError(result.error ?? "Could not start MFA verification.");
      return;
    }

    setMfaChallenge(result.challenge);
    setResendSeconds(smsMfaEnabled && factor.type === "phone" ? 45 : 0);
    setMessage(smsMfaEnabled && factor.type === "phone" ? "We sent a new verification code to your phone." : "");
  }

  function enterDemo() {
    auth.enterDemoMode();
    router.replace("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-6 flex w-max items-center gap-3">
          <BrandLogo className="h-12 w-auto" />
          <span className="text-xl font-black text-[#10201c]">SpendFence</span>
        </Link>

        <Card className="p-5 sm:p-6">
          <Pill className="border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]">
            <ShieldCheck size={13} className="mr-1" /> {content.kicker}
          </Pill>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#10201c]">{content.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {mode === "signup" ? "Create a secure password to protect your financial data." : content.body}
          </p>

          <form className="mt-6 grid gap-4" onSubmit={submit}>
            {mfaChallenge ? (
              <>
                <div className="rounded-2xl border border-[#cfe8de] bg-[#f7faf7] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#183f36]">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#10201c]">Extra verification required</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        Protect your financial data with an extra layer of security.
                      </p>
                    </div>
                  </div>
                  {mfaFactors.length > 1 ? (
                    <div className="mt-4 grid gap-2">
                      {mfaFactors.map((factor) => (
                        <button
                          className={`flex min-h-11 items-center justify-between rounded-2xl border px-3 text-left text-sm font-black transition ${
                            factor.id === mfaChallenge.factorId
                              ? "border-[#58c6a8] bg-white text-[#183f36]"
                              : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                          }`}
                          disabled={submitting || factor.id === mfaChallenge.factorId}
                          key={factor.id}
                          onClick={() => switchMfaFactor(factor)}
                          type="button"
                        >
                          <span>{factor.type === "totp" ? "Authenticator app" : "SMS verification"}</span>
                          <span className="text-xs text-slate-500">{factor.phone ?? factor.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Field label={activeFactor?.type === "phone" ? "SMS verification code" : "Authenticator code"}>
                  <Input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value)}
                    placeholder="123456"
                    required
                  />
                </Field>

                <p className="text-sm font-semibold leading-6 text-slate-600">
                  Authenticator-based MFA is currently the recommended security method. Additional verification methods may arrive in future updates.
                </p>

                <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <input
                    className="mt-1 h-4 w-4 accent-[#183f36]"
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(event) => setTrustDevice(event.target.checked)}
                  />
                  <span>Trust this device for 30 days</span>
                </label>
              </>
            ) : (
              <>
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
                        minLength={mode === "signup" ? 12 : 6}
                        required
                      />
                    </div>
                    {mode === "signup" ? <PasswordStrengthPanel checks={passwordChecks} password={password} strength={passwordStrength} /> : null}
                  </Field>
                ) : null}
              </>
            )}

            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Working..." : mfaChallenge ? "Verify and continue" : content.button}
              <ArrowRight size={18} />
            </Button>
          </form>

          {mode === "login" && auth.demoModeAvailable ? (
            <div className="mt-4 rounded-3xl border border-dashed border-[#cfe8de] bg-[#f7faf7] p-4">
              <p className="text-sm font-black text-[#10201c]">Local Mode</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Supabase keys are missing in development. Use a local account without production authentication.
              </p>
              <Button type="button" variant="secondary" className="mt-3 w-full" onClick={enterDemo}>
                Enter Local Mode
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

type PasswordCheck = {
  label: string;
  met: boolean;
};

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "12+ characters", met: password.length >= 12 },
    { label: "uppercase", met: /[A-Z]/.test(password) },
    { label: "lowercase", met: /[a-z]/.test(password) },
    { label: "number", met: /\d/.test(password) },
    { label: "special character", met: /[^A-Za-z0-9]/.test(password) }
  ];
}

function getPasswordStrength(password: string, score: number) {
  if (!password) return { label: "Weak", percent: 8, className: "bg-slate-300 text-slate-600" };
  if (score <= 2) return { label: "Weak", percent: 25, className: "bg-rose-500 text-rose-700" };
  if (score === 3) return { label: "Fair", percent: 50, className: "bg-amber-500 text-amber-700" };
  if (score === 4) return { label: "Strong", percent: 75, className: "bg-emerald-500 text-emerald-700" };
  return { label: "Excellent", percent: 100, className: "bg-[#183f36] text-[#183f36]" };
}

function PasswordStrengthPanel({
  checks,
  password,
  strength
}: {
  checks: PasswordCheck[];
  password: string;
  strength: { label: string; percent: number; className: string };
}) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Password strength</p>
        <p className={`text-sm font-black ${strength.className.split(" ").at(-1)}`}>{strength.label}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full transition-all ${strength.className.split(" ")[0]}`} style={{ width: `${strength.percent}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {password ? "Use a password that is long, unique, and hard to guess." : "Start typing to see password requirements update live."}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <div className={`flex items-center gap-2 text-sm font-bold ${check.met ? "text-[#327d6d]" : "text-slate-500"}`} key={check.label}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${check.met ? "bg-[#e9f3ee]" : "bg-white"}`}>
              <Check size={13} />
            </span>
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

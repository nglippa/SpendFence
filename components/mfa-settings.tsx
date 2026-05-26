"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, RefreshCw, ShieldCheck, ShieldPlus, Smartphone, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Pill, Select } from "@/components/ui";
import { ConfirmSheet } from "@/components/settings-ui";
import { useAuth } from "@/lib/auth";
import { featureFlags } from "@/lib/feature-flags";
import { assertSmsMfaEnabled, mfaProviders } from "@/lib/mfa-providers";
import { getSupabaseClient } from "@/lib/supabase";

const RESEND_COOLDOWN_SECONDS = 45;
const SMS_MFA_PLANNED_COPY = "Additional verification methods may arrive in future updates.";

const countryCodes = [
  { label: "US +1", value: "+1" },
  { label: "CA +1", value: "+1" },
  { label: "GB +44", value: "+44" },
  { label: "AU +61", value: "+61" },
  { label: "NZ +64", value: "+64" },
  { label: "IE +353", value: "+353" },
  { label: "DE +49", value: "+49" },
  { label: "FR +33", value: "+33" },
  { label: "ES +34", value: "+34" },
  { label: "MX +52", value: "+52" }
];

type Method = "totp" | "phone";

type FactorSummary = {
  id: string;
  type: Method;
  label: string;
  phone?: string;
  createdAt?: string;
  lastChallengedAt?: string;
};

type PendingTotp = {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
};

type PendingPhone = {
  factorId: string;
  challengeId: string;
  phone: string;
};

export function MfaSettings() {
  const auth = useAuth();
  const supabase = getSupabaseClient();
  const smsMfaEnabled = featureFlags.ENABLE_SMS_MFA;
  const [factors, setFactors] = useState<FactorSummary[]>([]);
  const [aal, setAal] = useState("aal1");
  const [primaryMethod, setPrimaryMethodState] = useState<Method>("totp");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingTotp, setPendingTotp] = useState<PendingTotp | null>(null);
  const [pendingPhone, setPendingPhone] = useState<PendingPhone | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<FactorSummary | null>(null);

  const hasTotp = factors.some((factor) => factor.type === "totp");
  const hasPhone = factors.some((factor) => factor.type === "phone");
  const smsProvider = mfaProviders.sms;
  const activeFactors = smsMfaEnabled ? factors : factors.filter((factor) => factor.type !== "phone");
  const primaryAvailable = activeFactors.some((factor) => factor.type === primaryMethod);
  const qrSrc = useMemo(() => {
    if (!pendingTotp) return "";
    return pendingTotp.qrCode.startsWith("data:") ? pendingTotp.qrCode : `data:image/svg+xml;utf8,${encodeURIComponent(pendingTotp.qrCode)}`;
  }, [pendingTotp]);

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    // TODO(sms-mfa): Keep the resend timer ready for future SMS MFA, but do not
    // run it while the feature flag is disabled.
    if (!smsMfaEnabled || cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown, smsMfaEnabled]);

  async function refreshStatus() {
    setLoading(true);
    setError("");
    setMessage("");

    if (!supabase || !auth.user || auth.user.isDemo) {
      setLoading(false);
      return;
    }

    const [factorResult, aalResult, userResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.getUser()
    ]);

    if (factorResult.error) setError(factorResult.error.message);
    if (aalResult.error) setError(aalResult.error.message);

    if (factorResult.data) {
      const phoneFactors = smsMfaEnabled ? normalizeFactors(factorResult.data.phone, "phone") : [];
      setFactors([...normalizeFactors(factorResult.data.totp, "totp"), ...phoneFactors]);
    }

    if (aalResult.data?.currentLevel) setAal(aalResult.data.currentLevel);

    const metadataMethod = userResult.data.user?.user_metadata?.spendfence_mfa_primary_method;
    if (metadataMethod === "totp" || (smsMfaEnabled && metadataMethod === "phone")) setPrimaryMethodState(metadataMethod);

    setLoading(false);
  }

  async function startTotpEnrollment() {
    if (!supabase) return;
    setWorking(true);
    setError("");
    setMessage("");

    const enroll = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "SpendFence authenticator",
      issuer: "SpendFence"
    });

    if (enroll.error) {
      setError(enroll.error.message);
      setWorking(false);
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.data.id });
    if (challenge.error) {
      setError(challenge.error.message);
      setWorking(false);
      return;
    }

    setPendingTotp({
      factorId: enroll.data.id,
      challengeId: challenge.data.id,
      qrCode: enroll.data.totp.qr_code,
      secret: enroll.data.totp.secret
    });
    setWorking(false);
  }

  async function verifyTotp() {
    if (!supabase || !pendingTotp) return;
    setWorking(true);
    setError("");
    setMessage("");

    const result = await supabase.auth.mfa.verify({
      factorId: pendingTotp.factorId,
      challengeId: pendingTotp.challengeId,
      code: totpCode
    });

    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }

    setPendingTotp(null);
    setTotpCode("");
    setMessage("Authenticator app MFA is enabled.");
    setWorking(false);
    await setPrimaryMethod("totp", false);
    await refreshStatus();
  }

  async function startPhoneEnrollment() {
    // TODO(sms-mfa): Re-enable this Supabase phone MFA flow when ENABLE_SMS_MFA
    // is true and SMS provider/service controls are approved.
    if (!smsMfaEnabled) {
      setMessage(`${smsProvider.label} is planned for a future update.`);
      return;
    }

    await assertSmsMfaEnabled();

    if (!supabase || cooldown > 0) return;
    const phone = formatPhone(countryCode, phoneNumber);
    if (!phone) {
      setError("Enter a valid phone number with digits only.");
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");

    const enroll = await supabase.auth.mfa.enroll({
      factorType: "phone",
      friendlyName: "SpendFence SMS backup",
      phone
    });

    if (enroll.error) {
      setError(enroll.error.message);
      setWorking(false);
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.data.id, channel: "sms" });
    if (challenge.error) {
      setError(challenge.error.message);
      setWorking(false);
      return;
    }

    setPendingPhone({
      factorId: enroll.data.id,
      challengeId: challenge.data.id,
      phone: enroll.data.phone
    });
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setMessage("We sent a verification code to your phone.");
    setWorking(false);
  }

  async function verifyPhone() {
    if (!smsMfaEnabled) {
      setMessage(`${smsProvider.label} is planned for a future update.`);
      return;
    }

    await assertSmsMfaEnabled();

    if (!supabase || !pendingPhone) return;
    setWorking(true);
    setError("");
    setMessage("");

    const result = await supabase.auth.mfa.verify({
      factorId: pendingPhone.factorId,
      challengeId: pendingPhone.challengeId,
      code: phoneCode
    });

    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }

    setPendingPhone(null);
    setPhoneCode("");
    setPhoneNumber("");
    setMessage("SMS verification is enabled.");
    setWorking(false);
    if (!hasTotp) await setPrimaryMethod("phone", false);
    await refreshStatus();
  }

  async function resendPhoneCode() {
    if (!smsMfaEnabled) {
      setMessage(`${smsProvider.label} is planned for a future update.`);
      return;
    }

    await assertSmsMfaEnabled();

    if (!supabase || !pendingPhone || cooldown > 0) return;
    setWorking(true);
    setError("");
    setMessage("");

    const challenge = await supabase.auth.mfa.challenge({ factorId: pendingPhone.factorId, channel: "sms" });
    if (challenge.error) {
      setError(challenge.error.message);
      setWorking(false);
      return;
    }

    setPendingPhone({ ...pendingPhone, challengeId: challenge.data.id });
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setMessage("We sent a new verification code.");
    setWorking(false);
  }

  async function removeFactor(factor: FactorSummary) {
    if (!supabase) return;
    setPendingRemoval(factor);
  }

  async function confirmRemoveFactor() {
    if (!supabase || !pendingRemoval) return;
    setWorking(true);
    setError("");
    setMessage("");

    const result = await supabase.auth.mfa.unenroll({ factorId: pendingRemoval.id });
    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }

    setMessage("MFA factor removed.");
    setPendingRemoval(null);
    setWorking(false);
    await refreshStatus();
  }

  async function setPrimaryMethod(method: Method, showMessage = true) {
    if (method === "phone" && !smsMfaEnabled) {
      setMessage("SMS verification is planned for a future update. Authenticator app remains the active method.");
      return;
    }

    if (!supabase) return;
    setWorking(true);
    setError("");
    if (showMessage) setMessage("");

    const result = await supabase.auth.updateUser({
      data: { spendfence_mfa_primary_method: method }
    });

    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }

    setPrimaryMethodState(method);
    if (showMessage) setMessage(`${method === "totp" ? "Authenticator app" : "SMS"} is now your primary MFA method.`);
    setWorking(false);
  }

  if (!supabase || auth.user?.isDemo) {
    return (
      <Card className="p-4 sm:p-5 lg:col-span-2">
        <MfaHeader />
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
          MFA settings are available when you are signed in with Supabase authentication.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 lg:col-span-2">
      <MfaHeader />

      <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
        <StatusTile label="MFA status" value={activeFactors.length ? "Enabled" : "Not enabled"} tone={activeFactors.length ? "good" : "neutral"} />
        <StatusTile label="Session level" value={aal.toUpperCase()} tone={aal === "aal2" ? "good" : "neutral"} />
        <StatusTile label="Primary method" value={primaryAvailable ? methodLabel(primaryMethod) : "Not set"} tone={primaryAvailable ? "good" : "neutral"} />
      </div>

      <div className="mt-5 rounded-2xl border border-[#cfe8de] bg-[#f7faf7] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#183f36]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-[#10201c]">Authenticator apps currently provide the strongest supported protection for SpendFence accounts.</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Authenticator-based MFA is currently the recommended security method. Additional verification methods may arrive in future updates.
            </p>
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">{message}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#10201c]">Authenticator app</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Recommended for maximum protection.</p>
            </div>
            <Pill className={hasTotp ? "border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]" : "border-slate-200 bg-slate-50 text-slate-600"}>
              {hasTotp ? "Enabled" : "Available"}
            </Pill>
          </div>

          {pendingTotp ? (
            <div className="mt-4 grid gap-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                <img alt="Authenticator QR code" className="mx-auto h-44 w-44" src={qrSrc} />
              </div>
              <details className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                <summary className="cursor-pointer font-black text-slate-800">Manual setup key</summary>
                <Input className="mt-3 font-mono" readOnly type="password" value={pendingTotp.secret} />
              </details>
              <Field label="Authenticator code">
                <Input autoComplete="one-time-code" inputMode="numeric" value={totpCode} onChange={(event) => setTotpCode(event.target.value)} placeholder="123456" />
              </Field>
              <Button disabled={working || !totpCode} onClick={verifyTotp}>
                <KeyRound size={18} /> Verify authenticator
              </Button>
            </div>
          ) : (
            <Button className="mt-4 w-full" disabled={working || loading} onClick={startTotpEnrollment}>
              <ShieldPlus size={18} /> Enable authenticator app MFA
            </Button>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#10201c]">SMS verification</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {smsMfaEnabled ? "Use SMS as a primary method or backup phone." : "Planned as a future verification method."}
              </p>
            </div>
            <Pill className={smsMfaEnabled && hasPhone ? "border-[#cfe8de] bg-[#f3fbf7] text-[#327d6d]" : "border-slate-200 bg-slate-50 text-slate-600"}>
              {smsMfaEnabled && hasPhone ? "Enabled" : smsProvider.status === "planned" ? "Coming later" : "Available"}
            </Pill>
          </div>

          {!smsMfaEnabled ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-800">Planned feature</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                SMS verification is not active right now. The settings structure is preserved so phone-based verification can be restored after provider services and abuse controls are ready.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold leading-5 text-slate-500">
                  Country code selector prepared
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold leading-5 text-slate-500">
                  SMS provider hook prepared
                </div>
              </div>
            </div>
          ) : pendingPhone ? (
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                Verification code sent to {pendingPhone.phone}. Do not share this code with anyone.
              </div>
              <Field label="SMS verification code">
                <Input autoComplete="one-time-code" inputMode="numeric" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} placeholder="123456" />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button disabled={working || !phoneCode} onClick={verifyPhone}>
                  <Smartphone size={18} /> Verify SMS
                </Button>
                <Button disabled={working || cooldown > 0} onClick={resendPhoneCode} variant="secondary">
                  <RefreshCw size={18} /> {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-[7.25rem_1fr] gap-2">
                <Field label="Country">
                  <Select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                    {countryCodes.map((country) => (
                      <option key={`${country.label}-${country.value}`} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Phone number">
                  <Input inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="555 123 4567" />
                </Field>
              </div>
              <Button disabled={working || loading || cooldown > 0} onClick={startPhoneEnrollment}>
                <Smartphone size={18} /> {cooldown ? `Send in ${cooldown}s` : "Send verification code"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black text-[#10201c]">Primary MFA method</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Choose which method SpendFence starts with during login.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button disabled={working || !hasTotp} onClick={() => setPrimaryMethod("totp")} variant={primaryMethod === "totp" ? "primary" : "secondary"}>
              Authenticator app
            </Button>
            {smsMfaEnabled ? (
              <Button disabled={working || !hasPhone} onClick={() => setPrimaryMethod("phone")} variant={primaryMethod === "phone" ? "primary" : "secondary"}>
                SMS verification
              </Button>
            ) : (
              <Button disabled variant="secondary">
                SMS planned
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black text-[#10201c]">Trusted devices</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Trusted-device bypass is disabled. New browser and PWA sessions require sign-in again.
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
            Abuse prevention placeholder: Supabase rate limits MFA challenges; SMS cooldown controls are preserved for future reactivation.
          </p>
          <Pill className="mt-4 border-slate-200 bg-slate-50 text-slate-600">Locked off</Pill>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-[#10201c]">MFA factors</h3>
        <div className="mt-3 grid gap-2">
          {factors.length ? (
            factors.map((factor) => (
              <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={factor.id}>
                <div className="min-w-0">
                  <p className="font-black text-[#10201c]">{factor.type === "totp" ? "Authenticator app" : "SMS phone"}</p>
                  <p className="break-words text-sm font-semibold text-slate-600">{factor.phone ?? factor.label}</p>
                </div>
                <Button disabled={working} onClick={() => removeFactor(factor)} variant="danger">
                  <Trash2 size={17} /> Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
              MFA is ready when you want another layer of protection. Start with an authenticator app for the smoothest setup.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-black text-[#10201c]">Recovery and fallback</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FallbackItem enabled={hasTotp} label="Recovery codes" body="Recovery-code handling remains reserved for provider-backed account recovery." />
          <FallbackItem enabled={false} label="SMS fallback" body={SMS_MFA_PLANNED_COPY} />
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Keep your authenticator recovery codes from Google Authenticator, Authy, Microsoft Authenticator, 1Password, or your password manager in a safe place.
        </p>
      </div>
      <ConfirmSheet
        open={Boolean(pendingRemoval)}
        danger
        working={working}
        title="Remove MFA factor?"
        body={`Remove ${pendingRemoval?.type === "totp" ? "authenticator app" : "SMS"} MFA from this account? You can add it again later.`}
        confirmLabel="Remove"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemoveFactor}
      />
    </Card>
  );
}

function MfaHeader() {
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#183f36]">
        <ShieldCheck size={22} />
      </div>
      <div>
        <h2 className="text-xl font-black text-[#10201c]">Multi-factor authentication</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Protect your financial data with an extra layer of security.
        </p>
      </div>
    </div>
  );
}

function StatusTile({ label, value, tone }: { label: string; value: string; tone: "good" | "neutral" }) {
  return (
    <div className={`rounded-2xl p-4 ${tone === "good" ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-700"}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-black">
        {tone === "good" ? <CheckCircle2 size={16} /> : null}
        {value}
      </p>
    </div>
  );
}

function FallbackItem({ enabled, label, body }: { enabled: boolean; label: string; body: string }) {
  return (
    <div className={`rounded-2xl p-4 ${enabled ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>
      <p className="font-black">{label}: {enabled ? "Ready" : "Not ready"}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{body}</p>
    </div>
  );
}

function normalizeFactors(factors: unknown[], type: Method): FactorSummary[] {
  return factors
    .map((factor) => {
      if (!factor || typeof factor !== "object") return null;
      const raw = factor as {
        id?: unknown;
        friendly_name?: unknown;
        phone?: unknown;
        created_at?: unknown;
        last_challenged_at?: unknown;
      };
      if (typeof raw.id !== "string") return null;

      return {
        id: raw.id,
        type,
        label: typeof raw.friendly_name === "string" ? raw.friendly_name : methodLabel(type),
        phone: typeof raw.phone === "string" ? raw.phone : undefined,
        createdAt: typeof raw.created_at === "string" ? raw.created_at : undefined,
        lastChallengedAt: typeof raw.last_challenged_at === "string" ? raw.last_challenged_at : undefined
      };
    })
    .filter(Boolean) as FactorSummary[];
}

function formatPhone(countryCode: string, phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return `${countryCode}${digits}`;
}

function methodLabel(method: Method) {
  return method === "totp" ? "Authenticator app" : "SMS verification";
}

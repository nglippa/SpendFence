import { featureFlags } from "@/lib/feature-flags";

export type MfaProviderId = "totp" | "sms";

export type MfaProviderStatus = "active" | "planned";

export type MfaProviderConfig = {
  id: MfaProviderId;
  label: string;
  status: MfaProviderStatus;
  recommended: boolean;
};

export const mfaProviders = {
  totp: {
    id: "totp",
    label: "Authenticator app",
    status: "active",
    recommended: true
  },
  sms: {
    id: "sms",
    label: "SMS verification",
    status: featureFlags.ENABLE_SMS_MFA ? "active" : "planned",
    recommended: false
  }
} satisfies Record<MfaProviderId, MfaProviderConfig>;

export async function assertSmsMfaEnabled() {
  // TODO(sms-mfa): Replace this guard with provider-specific setup checks
  // when SMS MFA is re-enabled. Supabase MFA remains the verification source;
  // this abstraction is only for SpendFence feature wiring and provider status.
  if (!featureFlags.ENABLE_SMS_MFA) {
    throw new Error("SMS MFA is disabled by feature flag.");
  }
}

const enabledValues = new Set(["1", "true", "yes", "on"]);

export const featureFlags = {
  // TODO(sms-mfa): Keep false until SMS MFA has approved provider configuration,
  // abuse controls, and product support re-enabled.
  ENABLE_SMS_MFA: enabledValues.has((process.env.NEXT_PUBLIC_ENABLE_SMS_MFA ?? process.env.ENABLE_SMS_MFA ?? "false").toLowerCase())
} as const;

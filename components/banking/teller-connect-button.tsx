"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

type TellerEnrollment = {
  accessToken?: string;
  access_token?: string;
  id?: string;
  institution?: {
    name?: string;
  };
};

type TellerConnect = {
  setup: (config: {
    applicationId: string;
    environment: string;
    onSuccess: (enrollment: TellerEnrollment) => void;
    onExit?: () => void;
  }) => { open: () => void };
};

declare global {
  interface Window {
    TellerConnect?: TellerConnect;
  }
}

export function TellerConnectButton({
  disabled = false,
  requestHeaders,
  onConnected,
  onMessage
}: {
  disabled?: boolean;
  requestHeaders: () => Promise<HeadersInit>;
  onConnected?: () => void;
  onMessage?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const applicationId = process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    loadTellerConnect().then((ready) => {
      if (!cancelled) setScriptReady(ready);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function openConnect() {
    if (!applicationId) {
      onMessage?.("Teller Connect is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      const configResponse = await fetch("/api/teller/config", { cache: "no-store" });
      const config = (await configResponse.json().catch(() => ({}))) as { environment?: string };

      const teller = window.TellerConnect ?? (await loadTellerConnect().then(() => window.TellerConnect));
      if (!teller) {
        onMessage?.("Teller Connect could not load in this browser.");
        return;
      }

      teller
        .setup({
          applicationId,
          environment: config.environment ?? "development",
          onSuccess: async (enrollment) => {
            const accessToken = enrollment.accessToken ?? enrollment.access_token;
            if (!accessToken) {
              onMessage?.("Teller did not return an enrollment token.");
              return;
            }

            const response = await fetch("/api/teller/enrollments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(await requestHeaders())
              },
              body: JSON.stringify({ accessToken })
            });
            const data = (await response.json()) as { message?: string };
            onMessage?.(data.message ?? (response.ok ? "Bank account connected." : "Bank account could not be connected."));
            if (response.ok) onConnected?.();
          },
          onExit: () => onMessage?.("Teller connection was closed. Nothing changed.")
        })
        .open();
    } catch {
      onMessage?.("Teller Connect is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={openConnect} disabled={disabled || loading || !scriptReady || !applicationId}>
      {loading ? <RefreshCw size={18} className="animate-spin" /> : <Building2 size={18} />}
      Connect bank account
    </Button>
  );
}

function loadTellerConnect() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.TellerConnect) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://cdn.teller.io/connect/connect.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.TellerConnect)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.teller.io/connect/connect.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.TellerConnect));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

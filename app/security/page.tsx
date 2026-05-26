import type { Metadata } from "next";
import { SecurityMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Security | SpendFence",
  description: "SpendFence is designed around user-controlled approvals, privacy-conscious architecture, and read-only future integrations."
};

export default function Page() {
  return <SecurityMarketingPage />;
}

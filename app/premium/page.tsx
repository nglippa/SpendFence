import type { Metadata } from "next";
import { PricingMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Premium | SpendFence",
  description: "Subscribe to SpendFence Premium for unlimited bank syncing, advanced intelligence, and deeper adaptive budgeting insights."
};

export default function Page() {
  return <PricingMarketingPage />;
}

import type { Metadata } from "next";
import { FeaturesMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Features | SpendFence",
  description: "Adaptive Fences, Smart Insights, Receipt Scanning, Recurring Charges, Spending Rules, and a mobile-first PWA."
};

export default function Page() {
  return <FeaturesMarketingPage />;
}

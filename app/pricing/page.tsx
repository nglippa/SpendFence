import type { Metadata } from "next";
import { PricingMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Pricing | SpendFence",
  description: "Start free with adaptive budgeting basics. Upgrade to Premium for deeper behavioral insights and unlimited Teller account linking."
};

export default function Page() {
  return <PricingMarketingPage />;
}

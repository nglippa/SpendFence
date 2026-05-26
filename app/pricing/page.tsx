import type { Metadata } from "next";
import { PricingMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Pricing | SpendFence",
  description: "Start free with adaptive budgeting basics. Premium intelligence is planned for deeper behavioral insights."
};

export default function Page() {
  return <PricingMarketingPage />;
}

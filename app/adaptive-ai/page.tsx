import type { Metadata } from "next";
import { AdaptiveAiMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Adaptive AI | SpendFence",
  description: "AI-assisted budgeting that suggests realistic spending fences while users approve every meaningful change."
};

export default function Page() {
  return <AdaptiveAiMarketingPage />;
}

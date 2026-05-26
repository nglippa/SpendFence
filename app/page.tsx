import type { Metadata } from "next";
import { HomeMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "SpendFence | Adaptive AI Budgeting",
  description: "Adaptive budgeting powered by AI-assisted financial pacing and behavioral spending intelligence."
};

export default function Page() {
  return <HomeMarketingPage />;
}

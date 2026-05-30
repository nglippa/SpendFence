import type { Metadata } from "next";
import { HomeMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "SpendFence | Adaptive Budgeting",
  description: "Adaptive budgeting powered by financial pacing and behavioral spending intelligence."
};

export default function Page() {
  return <HomeMarketingPage />;
}

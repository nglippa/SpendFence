import type { Metadata } from "next";
import { PhilosophyMarketingPage } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Philosophy | SpendFence",
  description: "Why SpendFence uses behavioral spending intelligence and adaptive pacing instead of rigid fantasy budgets."
};

export default function Page() {
  return <PhilosophyMarketingPage />;
}

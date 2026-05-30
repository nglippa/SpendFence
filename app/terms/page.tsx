import type { Metadata } from "next";
import { LegalMarketingPage, type LegalSection } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Terms of Service | SpendFence",
  description: "The terms governing your use of SpendFence, including subscriptions, account connections, and disclaimers."
};

const effectiveDate = "May 30, 2026";

const sections: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern your access to and use of the SpendFence budgeting application and related services (the \"Service\"), operated by SpendFence by Lippa Labs (\"SpendFence,\" \"we,\" \"us,\" or \"our\"). By creating an account or using the Service, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the Service."
    ]
  },
  {
    heading: "Eligibility",
    paragraphs: [
      "You must be at least 18 years old and able to form a binding contract to use the Service. By using the Service, you represent that you meet these requirements."
    ]
  },
  {
    heading: "Not Financial Advice",
    paragraphs: [
      "SpendFence provides budgeting and spending-awareness tools for informational purposes only. We are not a bank, broker, lender, tax preparer, or financial, investment, or legal advisor. Nothing in the Service constitutes financial advice, and you are solely responsible for your financial decisions. Consult a qualified professional before making decisions based on information in the Service."
    ]
  },
  {
    heading: "Your Account",
    bullets: [
      "You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.",
      "You agree to provide accurate information and to keep it current.",
      "Notify us promptly of any unauthorized use of your account.",
      "We recommend enabling multi-factor authentication where available."
    ]
  },
  {
    heading: "Linked Financial Accounts",
    paragraphs: [
      "The Service lets you connect bank and card accounts through third-party providers (Plaid and Teller). By connecting an account, you authorize us and these providers to access transaction and balance information on your behalf. Your use of these connections is also subject to the providers' own terms and privacy policies. We are not responsible for the accuracy or availability of data supplied by these providers or your financial institutions."
    ]
  },
  {
    heading: "Subscriptions and Billing",
    bullets: [
      "Premium features are offered on a subscription basis and billed through Stripe.",
      "Subscriptions renew automatically at the end of each billing period unless cancelled beforehand.",
      "You can cancel at any time; access continues until the end of the current paid period.",
      "Fees are non-refundable except where required by law or expressly stated. Prices may change with prior notice."
    ]
  },
  {
    heading: "Acceptable Use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the Service for any unlawful, fraudulent, or unauthorized purpose.",
      "Attempt to access accounts or data that are not yours.",
      "Interfere with, disrupt, reverse engineer, or attempt to gain unauthorized access to the Service or its systems.",
      "Upload malicious code or content that infringes the rights of others."
    ]
  },
  {
    heading: "Intellectual Property",
    paragraphs: [
      "The Service, including its software, design, and content, is owned by SpendFence and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes. You retain ownership of the data you provide."
    ]
  },
  {
    heading: "Disclaimers",
    paragraphs: [
      "The Service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that data will always be accurate or current."
    ]
  },
  {
    heading: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, SpendFence and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data, profits, or financial loss arising from your use of the Service. Our total liability for any claim will not exceed the amount you paid us in the twelve months preceding the claim."
    ]
  },
  {
    heading: "Termination",
    paragraphs: [
      "You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you violate these Terms or to protect the Service and its users. Provisions that by their nature should survive termination will survive."
    ]
  },
  {
    heading: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the State of Texas, United States, without regard to conflict-of-law principles. Disputes will be resolved in the state or federal courts located in Harris County, Texas, unless otherwise required by applicable law."
    ]
  },
  {
    heading: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. Material changes will be communicated through the Service or by email, and the effective date above will be updated. Continued use after changes take effect constitutes acceptance."
    ]
  },
  {
    heading: "Contact Us",
    paragraphs: [
      "SpendFence is operated by SpendFence by Lippa Labs, an independent developer based in Houston, Texas. Questions about these Terms can be sent to lippalabsdev@gmail.com."
    ]
  }
];

export default function Page() {
  return (
    <LegalMarketingPage
      title="Terms of Service"
      effectiveDate={effectiveDate}
      intro="These terms set out the rules for using SpendFence, including subscriptions, account connections, and the limits of what the Service provides."
      sections={sections}
    />
  );
}

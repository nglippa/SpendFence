import type { Metadata } from "next";
import { LegalMarketingPage, type LegalSection } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: "Privacy Policy | SpendFence",
  description: "How SpendFence collects, uses, shares, and protects your personal and financial information."
};

const effectiveDate = "May 30, 2026";

const sections: LegalSection[] = [
  {
    heading: "Overview",
    paragraphs: [
      "This Privacy Policy explains how SpendFence (\"SpendFence,\" \"we,\" \"us,\" or \"our\") collects, uses, discloses, and safeguards information when you use our budgeting application and related services (the \"Service\"). By using the Service, you agree to the practices described here.",
      "SpendFence is a budgeting tool. We are not a bank, lender, or financial advisor, and the Service does not provide financial advice."
    ]
  },
  {
    heading: "Information We Collect",
    paragraphs: ["We collect the following categories of information:"],
    bullets: [
      "Account information: email address, authentication credentials, and multi-factor authentication settings.",
      "Financial connection data: when you link a bank or card account through our providers (Plaid and Teller), we receive transaction history, balances, and account metadata. We never receive or store your bank login credentials — those are handled by the connection provider.",
      "Transaction and budgeting data: purchases, categories, spending fences, rules, and receipt images you add or import.",
      "Payment information: subscription and billing details are processed by Stripe. We do not store full card numbers on our servers.",
      "Usage and device data: app interactions, log data, and basic device information used to operate and improve the Service."
    ]
  },
  {
    heading: "How We Use Your Information",
    bullets: [
      "Provide, maintain, and secure the Service, including authentication and fraud prevention.",
      "Categorize transactions, generate spending observations, and power adaptive budgeting features.",
      "Process subscription payments and manage your account.",
      "Communicate with you about the Service, including security and transactional notices.",
      "Comply with legal obligations and enforce our Terms of Service."
    ]
  },
  {
    heading: "AI Processing",
    paragraphs: [
      "Certain features (such as transaction categorization, receipt analysis, and spending insights) use third-party AI providers to process the minimum data necessary to generate a result. Data sent to these providers is used to return the requested output and is not used by us to build advertising profiles."
    ]
  },
  {
    heading: "How We Share Information",
    paragraphs: [
      "We do not sell your personal information. We share information only with service providers who help us operate the Service, and only as needed to perform their functions. Our key sub-processors include:"
    ],
    bullets: [
      "Plaid and Teller — bank and card account connectivity. Your use of these connections is also governed by the provider's privacy policy (see Plaid's End User Privacy Policy at plaid.com/legal).",
      "Stripe — subscription billing and payment processing.",
      "Supabase — authentication and encrypted data storage.",
      "AI providers — transaction categorization, receipt analysis, and insights.",
      "Legal and safety: we may disclose information if required by law or to protect the rights, property, or safety of users and the public."
    ]
  },
  {
    heading: "Data Retention",
    paragraphs: [
      "We retain your information for as long as your account is active or as needed to provide the Service. When you delete your account, we delete or anonymize your personal and financial data within a commercially reasonable period, except where retention is required by law."
    ]
  },
  {
    heading: "Security",
    paragraphs: [
      "We use encryption in transit and at rest, access controls, and optional multi-factor authentication to protect your data. No method of transmission or storage is completely secure, and we cannot guarantee absolute security."
    ]
  },
  {
    heading: "Your Rights and Choices",
    paragraphs: [
      "Depending on your location, you may have the right to access, correct, export, or delete your personal information, and to withdraw consent for certain processing. You can disconnect linked financial accounts at any time from within the app. To exercise these rights, contact us using the details below."
    ]
  },
  {
    heading: "Children's Privacy",
    paragraphs: [
      "The Service is not intended for individuals under 18, and we do not knowingly collect personal information from children."
    ]
  },
  {
    heading: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Material changes will be communicated through the Service or by email, and the effective date above will be updated."
    ]
  },
  {
    heading: "Contact Us",
    paragraphs: [
      "SpendFence is operated by SpendFence by Lippa Labs, an independent developer based in Houston, Texas. Questions about this Privacy Policy or your data, including requests to access, export, or delete your information, can be sent to lippalabsdev@gmail.com and we will respond within a reasonable period."
    ]
  }
];

export default function Page() {
  return (
    <LegalMarketingPage
      title="Privacy Policy"
      effectiveDate={effectiveDate}
      intro="Your financial data is sensitive, and we treat it that way. This policy describes what we collect, how we use it, and the controls you have."
      sections={sections}
    />
  );
}

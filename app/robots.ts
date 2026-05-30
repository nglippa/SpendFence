import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://spendfence.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/settings",
        "/categories",
        "/add-purchase",
        "/receipt-scanner",
        "/transaction-review",
        "/notifications",
        "/onboarding",
        "/checkout",
        "/adaptive-ai",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

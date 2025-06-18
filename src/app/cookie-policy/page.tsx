import { Metadata } from "next";
import CookiePolicyClient from "./cookie-policy-client";
import { generate_metadata } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: "Cookie Policy",
  description:
    "Learn how Studio Moikas uses cookies to improve your experience. Manage your cookie preferences and understand what data we collect.",
  keywords: [
    "cookie policy",
    "privacy",
    "data collection",
    "cookie preferences",
    "analytics cookies",
    "Studio Moikas cookies",
  ],
  canonical_path: "/cookie-policy",
  no_index: false,
});

export default function Cookie_policy_page() {
  return <CookiePolicyClient />;
}

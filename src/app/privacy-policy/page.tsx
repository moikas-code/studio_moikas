import { Metadata } from "next";
import PrivacyPolicyClient from "./privacy-policy-client";
import { generate_metadata } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: "Privacy Policy",
  description:
    "Studio Moikas privacy policy. Learn how we collect, use, and protect your data. We never sell your personal information.",
  keywords: [
    "privacy policy",
    "data protection",
    "GDPR",
    "user privacy",
    "data security",
    "Studio Moikas privacy",
  ],
  canonical_path: "/privacy-policy",
  no_index: false, // Legal pages should be indexed for transparency
});

export default function Privacy_policy_page() {
  return <PrivacyPolicyClient />;
}

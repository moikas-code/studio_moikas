import { Metadata } from "next";
import TermsOfServiceClient from "./terms-of-service-client";
import { generate_metadata } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: "Terms of Service",
  description:
    "Studio Moikas Terms of Service. Learn about acceptable use, content rights, payment terms, and user responsibilities for our AI creative tools.",
  keywords: [
    "terms of service",
    "user agreement",
    "legal terms",
    "acceptable use policy",
    "content licensing",
    "Studio Moikas terms",
  ],
  canonical_path: "/terms-of-service",
  no_index: false,
});

export default function Terms_of_service_page() {
  return <TermsOfServiceClient />;
}

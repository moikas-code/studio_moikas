import { Metadata } from "next";
import DMCAClient from "./dmca-client";
import { generate_metadata } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: "DMCA Policy & Copyright Protection",
  description:
    "Studio Moikas DMCA policy and copyright infringement reporting. We respect intellectual property rights and respond promptly to valid DMCA notices.",
  keywords: [
    "DMCA policy",
    "copyright protection",
    "intellectual property",
    "copyright infringement",
    "DMCA notice",
    "Studio Moikas DMCA",
  ],
  canonical_path: "/dmca",
  no_index: false,
});

export default function DMCA_page() {
  return <DMCAClient />;
}

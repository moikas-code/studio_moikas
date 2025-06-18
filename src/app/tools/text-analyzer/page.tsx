import { Metadata } from "next";
import TextAnalyzerClient from "./text-analyzer-client";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.text_analyzer.title,
  description: TOOL_METADATA.text_analyzer.description,
  keywords: TOOL_METADATA.text_analyzer.keywords,
  canonical_path: "/tools/text-analyzer",
  og_image: TOOL_METADATA.text_analyzer.og_image,
});

export default function Text_analyzer_page() {
  const software_schema = generate_software_application_schema({
    name: "Studio Moikas Text Analyzer",
    description: TOOL_METADATA.text_analyzer.description,
    category: "UtilitiesApplication",
    screenshot: TOOL_METADATA.text_analyzer.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Text Analyzer", path: "/tools/text-analyzer" },
  ]);

  return (
    <>
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(software_schema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb_schema),
        }}
      />
      <TextAnalyzerClient />
    </>
  );
}

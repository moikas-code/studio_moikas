import { Metadata } from "next";
import MemuClient from "./memu-client";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.memu.title,
  description: TOOL_METADATA.memu.description,
  keywords: TOOL_METADATA.memu.keywords,
  canonical_path: "/tools/memu",
  og_image: TOOL_METADATA.memu.og_image,
});

export default function Memu_page() {
  const software_schema = generate_software_application_schema({
    name: "MEMU - AI Workflow Automation",
    description: TOOL_METADATA.memu.description,
    category: "DeveloperApplication",
    screenshot: TOOL_METADATA.memu.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "MEMU", path: "/tools/memu" },
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
      <MemuClient />
    </>
  );
}

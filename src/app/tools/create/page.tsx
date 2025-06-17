import { Metadata } from "next";
import CreateClient from "./create-client";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.image_generator.title,
  description: TOOL_METADATA.image_generator.description,
  keywords: TOOL_METADATA.image_generator.keywords,
  canonical_path: "/tools/create",
  og_image: TOOL_METADATA.image_generator.og_image,
});

export default function Create_page() {
  const software_schema = generate_software_application_schema({
    name: "Studio Moikas Image Generator",
    description: TOOL_METADATA.image_generator.description,
    category: "DesignApplication",
    screenshot: TOOL_METADATA.image_generator.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Image Generator", path: "/tools/create" },
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
      <CreateClient />
    </>
  );
}

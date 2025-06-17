import { Metadata } from "next";
import Image_editor from "../../../components/image_editor";
import React from "react";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.image_editor.title,
  description: TOOL_METADATA.image_editor.description,
  keywords: TOOL_METADATA.image_editor.keywords,
  canonical_path: "/tools/image-editor",
  og_image: TOOL_METADATA.image_editor.og_image,
});

/**
 * Page for the Image Editor tool.
 * Uses snake_case for all identifiers.
 */
export default function Image_editor_page() {
  const software_schema = generate_software_application_schema({
    name: "Studio Moikas Image Editor",
    description: TOOL_METADATA.image_editor.description,
    category: "GraphicsApplication",
    screenshot: TOOL_METADATA.image_editor.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Image Editor", path: "/tools/image-editor" },
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
      <div className="h-full w-full px-0">
        <Image_editor />
      </div>
    </>
  );
}

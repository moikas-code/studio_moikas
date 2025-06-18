import { Metadata } from "next";
import AudioToolsClient from "./audio-client";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.audio.title,
  description: TOOL_METADATA.audio.description,
  keywords: TOOL_METADATA.audio.keywords,
  canonical_path: "/tools/audio",
  og_image: TOOL_METADATA.audio.og_image,
});

export default function Audio_page() {
  const software_schema = generate_software_application_schema({
    name: "Studio Moikas Audio Tools",
    description: TOOL_METADATA.audio.description,
    category: "AudioApplication",
    screenshot: TOOL_METADATA.audio.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Audio Tools", path: "/tools/audio" },
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
      <AudioToolsClient />
    </>
  );
}

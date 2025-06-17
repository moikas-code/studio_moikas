import { Metadata } from "next";
import VideoEffectsClient from "./video-effects-client";
import { generate_metadata, TOOL_METADATA } from "@/lib/seo";
import Script from "next/script";
import { generate_software_application_schema, generate_breadcrumb_list } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: TOOL_METADATA.video_effects.title,
  description: TOOL_METADATA.video_effects.description,
  keywords: TOOL_METADATA.video_effects.keywords,
  canonical_path: "/tools/video-effects",
  og_image: TOOL_METADATA.video_effects.og_image,
});

export default function Video_effects_page() {
  const software_schema = generate_software_application_schema({
    name: "Studio Moikas Video Effects",
    description: TOOL_METADATA.video_effects.description,
    category: "MultimediaApplication",
    screenshot: TOOL_METADATA.video_effects.og_image,
  });

  const breadcrumb_schema = generate_breadcrumb_list([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Video Effects", path: "/tools/video-effects" },
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
      <VideoEffectsClient />
    </>
  );
}

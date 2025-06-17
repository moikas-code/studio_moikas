import { Metadata } from "next";
import HomeClient from "./home-client";
import { generate_metadata } from "@/lib/seo";
import Script from "next/script";
import { generate_organization_schema, generate_web_application_schema } from "@/lib/seo";

export const metadata: Metadata = generate_metadata({
  title: "AI-Powered Creative Tools - Free Image, Video & Audio Generation",
  description:
    "Create stunning AI art with FLUX, SANA & Stable Diffusion. Generate videos, clone voices, and automate workflows. Start free with 125 MP monthly.",
  keywords: [
    "AI image generator",
    "AI art generator",
    "FLUX AI",
    "SANA model",
    "Stable Diffusion",
    "AI video effects",
    "text to speech",
    "voice cloning",
    "AI creative tools",
    "free AI generator",
    "Studio Moikas",
  ],
  canonical_path: "/",
  og_type: "website",
});

export default function Home() {
  const organization_schema = generate_organization_schema();
  const web_app_schema = generate_web_application_schema();

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization_schema),
        }}
      />
      <Script
        id="webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(web_app_schema),
        }}
      />
      <HomeClient />
    </>
  );
}

import { Metadata } from "next";

interface MetadataParams {
  title: string;
  description: string;
  keywords?: string[];
  canonical_path?: string;
  og_image?: string;
  no_index?: boolean;
  og_type?: "website" | "article";
}

export const generate_metadata = ({
  title,
  description,
  keywords = [],
  canonical_path = "",
  og_image,
  no_index = false,
  og_type = "website",
}: MetadataParams): Metadata => {
  const base_url = process.env.NEXT_PUBLIC_APP_URL || "https://studiomoikas.com";
  const canonical_url = `${base_url}${canonical_path}`;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    robots: no_index ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical_url,
      type: og_type,
      images: og_image ? [{ url: og_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: og_image ? [og_image] : undefined,
    },
    alternates: {
      canonical: canonical_url,
    },
  };
};

export const TOOL_METADATA = {
  memu: {
    title: "MEMU - AI Workflow Automation | Studio Moikas",
    description:
      "Create and manage AI workflows with MEMU. Build custom automation, chat interfaces, and integrate multiple AI models in a visual workflow editor.",
    keywords: [
      "AI workflow",
      "automation",
      "workflow editor",
      "AI orchestration",
      "multi-agent",
      "AI chat",
      "workflow automation",
      "MEMU",
    ],
    og_image: "/og-memu.png",
  },
  audio: {
    title: "AI Audio Tools - Text to Speech & Voice Cloning | Studio Moikas",
    description:
      "Transform text to natural speech with AI voices, clone voices, and convert documents to audio. Professional audio generation tools.",
    keywords: [
      "text to speech",
      "TTS",
      "voice cloning",
      "AI voice",
      "document to audio",
      "audio generation",
      "voice synthesis",
      "AI audio",
    ],
    og_image: "/og-audio.png",
  },
  image_generator: {
    title: "AI Image Generator - Create Art with AI | Studio Moikas",
    description:
      "Generate stunning images with advanced AI models including FLUX, SANA, and Stable Diffusion. Professional image creation tools.",
    keywords: [
      "AI image generator",
      "text to image",
      "AI art",
      "FLUX",
      "SANA",
      "Stable Diffusion",
      "image generation",
      "AI artwork",
    ],
    og_image: "/og-create.png",
  },
  video_effects: {
    title: "AI Video Effects - Generate & Enhance Videos | Studio Moikas",
    description:
      "Create and enhance videos with AI-powered effects. Generate videos from text, apply effects, and restore video quality.",
    keywords: [
      "AI video",
      "video generation",
      "video effects",
      "AI video editor",
      "video enhancement",
      "text to video",
      "video restoration",
      "AI video tools",
    ],
    og_image: "/og-video.png",
  },
  text_analyzer: {
    title: "AI Text Analyzer - Content Analysis Tools | Studio Moikas",
    description:
      "Analyze and understand text content with AI. Extract insights, summaries, and key information from any text.",
    keywords: [
      "text analysis",
      "content analysis",
      "AI analyzer",
      "text insights",
      "content understanding",
      "text processing",
      "AI text tools",
      "text analytics",
    ],
    og_image: "/og-text-analyzer.png",
  },
  image_editor: {
    title: "AI Image Editor - Edit Images with AI | Studio Moikas",
    description:
      "Edit and enhance images with AI-powered tools. Remove backgrounds, apply effects, and transform your images.",
    keywords: [
      "AI image editor",
      "image editing",
      "photo editor",
      "background removal",
      "image enhancement",
      "AI editing",
      "photo manipulation",
      "image tools",
    ],
    og_image: "/og-image-editor.png",
  },
};

interface SchemaItem {
  name: string;
  description: string;
  category: string;
  screenshot?: string;
}

export const generate_software_application_schema = (item: SchemaItem) => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.name,
    description: item.description,
    applicationCategory: item.category,
    screenshot: item.screenshot,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
};

interface BreadcrumbItem {
  name: string;
  path: string;
}

export const generate_breadcrumb_list = (items: BreadcrumbItem[]) => {
  const base_url = process.env.NEXT_PUBLIC_APP_URL || "https://studiomoikas.com";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base_url}${item.path}`,
    })),
  };
};

interface ProductSchemaItem {
  name: string;
  description: string;
  price?: string;
  currency?: string;
}

export const generate_product_schema = (item: ProductSchemaItem) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    offers: {
      "@type": "Offer",
      price: item.price || "0",
      priceCurrency: item.currency || "USD",
    },
  };
};

export const generate_organization_schema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Studio Moikas",
    url: "https://studiomoikas.com",
    logo: "https://studiomoikas.com/logo.png",
    sameAs: ["https://twitter.com/studiomoikas", "https://github.com/studiomoikas"],
  };
};

export const generate_web_application_schema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Studio Moikas",
    description:
      "AI-powered creative tools for image generation, video effects, audio processing, and workflow automation.",
    url: "https://studiomoikas.com",
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
};

interface FAQItem {
  question: string;
  answer: string;
}

export const generate_faq_schema = (items: FAQItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
};

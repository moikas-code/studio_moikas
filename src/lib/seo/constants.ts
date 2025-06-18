/**
 * SEO Constants and Defaults
 * Centralized SEO configuration for Studio Moikas
 */

export const SEO_DEFAULTS = {
  site_name: "Studio Moikas",
  site_url:
    process.env.NODE_ENV === "production" ? "https://studio.moikas.com" : "http://localhost:3000",
  title_template: "%s | Studio Moikas",
  default_title: "Studio Moikas - AI-Powered Creative Tools",
  default_description:
    "Create stunning images, videos, and audio with AI. Professional creative tools powered by FLUX, SANA, Stable Diffusion, and more. Start free.",
  default_keywords: [
    "AI image generator",
    "AI video effects",
    "text to speech",
    "AI creative tools",
    "FLUX image generation",
    "SANA AI",
    "Stable Diffusion",
    "AI art generator",
    "video restoration AI",
    "voice cloning",
    "Studio Moikas",
  ],
  author: {
    name: "Warren Gates",
    url: "https://moikas.com",
  },
  twitter: {
    handle: "@studiomoikas",
    card_type: "summary_large_image" as const,
  },
  og_image: {
    default: "/studio_moikas.PNG",
    width: 1200,
    height: 630,
  },
};

export const TOOL_METADATA = {
  image_generator: {
    title: "AI Image Generator",
    description:
      "Generate stunning images with FLUX, SANA, and Stable Diffusion. Advanced AI models with customizable settings. Start creating for free.",
    keywords: [
      "AI image generator",
      "FLUX AI",
      "SANA model",
      "Stable Diffusion",
      "AI art",
      "text to image",
    ],
    og_image: "/og-image-generator.png",
  },
  video_effects: {
    title: "AI Video Effects & Restoration",
    description:
      "Transform and restore videos with AI. Upscale, enhance, and apply stunning effects to your videos. Professional quality results.",
    keywords: [
      "AI video effects",
      "video restoration",
      "video upscaling",
      "AI video enhancement",
      "video AI",
    ],
    og_image: "/og-video-effects.png",
  },
  audio: {
    title: "AI Text-to-Speech & Voice Cloning",
    description:
      "Convert text to natural speech with AI voices. Clone voices, generate audio from documents, and create professional voiceovers.",
    keywords: [
      "text to speech",
      "voice cloning",
      "AI voices",
      "TTS",
      "voice synthesis",
      "audio generation",
    ],
    og_image: "/og-audio-tools.png",
  },
  memu: {
    title: "MEMU - AI Workflow Automation",
    description:
      "Build powerful AI workflows with our visual editor. Automate complex tasks with multiple AI agents working together.",
    keywords: [
      "AI workflow",
      "automation",
      "AI agents",
      "visual programming",
      "workflow editor",
      "MEMU",
    ],
    og_image: "/og-memu.png",
  },
  text_analyzer: {
    title: "AI Text Analyzer",
    description:
      "Analyze and understand text with AI. Extract insights, summarize content, and get intelligent text analysis.",
    keywords: ["text analysis", "AI analyzer", "text insights", "content analysis", "text AI"],
    og_image: "/og-text-analyzer.png",
  },
  image_editor: {
    title: "AI-Powered Image Editor",
    description:
      "Edit images with AI assistance. Layer-based editing, smart tools, and AI-powered enhancements for professional results.",
    keywords: [
      "image editor",
      "AI photo editing",
      "layer editing",
      "image manipulation",
      "photo editor",
    ],
    og_image: "/og-image-editor.png",
  },
};

export const PAGE_PRIORITIES = {
  home: 1.0,
  tools: 0.9,
  pricing: 0.8,
  legal: 0.5,
  admin: 0.0, // Should be excluded
};

export const ROBOTS_DISALLOW = [
  "/admin",
  "/api",
  "/sign-in",
  "/sign-up",
  "/tools/age-verification",
  "/_next",
  "/static",
];

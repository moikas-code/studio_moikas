import { Metadata } from "next";
import { SEO_DEFAULTS } from "./constants";

interface GenerateMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical_path?: string;
  og_image?: string;
  og_type?: "website" | "article";
  no_index?: boolean;
  twitter_card?: "summary" | "summary_large_image";
  author?: {
    name: string;
    url?: string;
  };
}

/**
 * Generate metadata for a page with SEO best practices
 */
export function generate_metadata(options: GenerateMetadataOptions): Metadata {
  const {
    title,
    description = SEO_DEFAULTS.default_description,
    keywords = SEO_DEFAULTS.default_keywords,
    canonical_path = "",
    og_image = SEO_DEFAULTS.og_image.default,
    og_type = "website",
    no_index = false,
    twitter_card = SEO_DEFAULTS.twitter.card_type,
    author = SEO_DEFAULTS.author,
  } = options;

  // Format title with template
  const formatted_title = title
    ? SEO_DEFAULTS.title_template.replace("%s", title)
    : SEO_DEFAULTS.default_title;

  // Generate canonical URL
  const canonical_url = canonical_path ? `${SEO_DEFAULTS.site_url}${canonical_path}` : undefined;

  // Build metadata object
  const metadata: Metadata = {
    title: formatted_title,
    description: truncate_description(description),
    keywords: keywords.join(", "),
    authors: [author],
    generator: "Next.js",
    manifest: "/manifest.json",
    metadataBase: new URL(SEO_DEFAULTS.site_url),
    alternates: canonical_url ? { canonical: canonical_url } : undefined,
    robots: no_index
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      title: formatted_title,
      description: truncate_description(description),
      url: canonical_url || SEO_DEFAULTS.site_url,
      siteName: SEO_DEFAULTS.site_name,
      type: og_type,
      locale: "en_US",
      images: [
        {
          url: og_image,
          width: SEO_DEFAULTS.og_image.width,
          height: SEO_DEFAULTS.og_image.height,
          alt: formatted_title,
        },
      ],
    },
    twitter: {
      card: twitter_card,
      title: formatted_title,
      description: truncate_description(description, 200),
      images: [og_image],
      creator: SEO_DEFAULTS.twitter.handle,
    },
    viewport:
      "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: "#35155D" },
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    ],
    icons: [
      { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
      { rel: "icon", url: "/icons/icon-192x192.png" },
    ],
  };

  return metadata;
}

/**
 * Truncate description to optimal length for SEO
 * Google typically displays 155-160 characters
 */
function truncate_description(description: string, max_length: number = 155): string {
  if (description.length <= max_length) return description;

  // Truncate at last complete word
  const truncated = description.substring(0, max_length);
  const last_space = truncated.lastIndexOf(" ");

  return last_space > 0 ? truncated.substring(0, last_space) + "..." : truncated + "...";
}

/**
 * Generate breadcrumb metadata for structured data
 */
export function generate_breadcrumb_list(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SEO_DEFAULTS.site_url}${item.path}`,
    })),
  };
}

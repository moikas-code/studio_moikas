import { SEO_DEFAULTS } from "./constants";

/**
 * Generate Organization schema for the website
 */
export function generate_organization_schema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_DEFAULTS.site_name,
    url: SEO_DEFAULTS.site_url,
    logo: `${SEO_DEFAULTS.site_url}/icons/icon-512x512.png`,
    description: SEO_DEFAULTS.default_description,
    founder: {
      "@type": "Person",
      name: SEO_DEFAULTS.author.name,
      url: SEO_DEFAULTS.author.url,
    },
    sameAs: [`https://twitter.com${SEO_DEFAULTS.twitter.handle}`],
  };
}

/**
 * Generate Product schema for tools
 */
export function generate_product_schema(product: {
  name: string;
  description: string;
  image?: string;
  offers?: {
    price: string;
    currency: string;
    availability: string;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || SEO_DEFAULTS.og_image.default,
    brand: {
      "@type": "Organization",
      name: SEO_DEFAULTS.site_name,
    },
    offers: product.offers
      ? {
          "@type": "Offer",
          price: product.offers.price,
          priceCurrency: product.offers.currency,
          availability: product.offers.availability,
          url: SEO_DEFAULTS.site_url,
        }
      : undefined,
  };
}

/**
 * Generate FAQ schema
 */
export function generate_faq_schema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate WebApplication schema for the main app
 */
export function generate_web_application_schema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SEO_DEFAULTS.site_name,
    url: SEO_DEFAULTS.site_url,
    description: SEO_DEFAULTS.default_description,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: SEO_DEFAULTS.author.name,
      url: SEO_DEFAULTS.author.url,
    },
  };
}

/**
 * Generate SoftwareApplication schema for specific tools
 */
export function generate_software_application_schema(tool: {
  name: string;
  description: string;
  category: string;
  screenshot?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category,
    operatingSystem: "Any",
    url: `${SEO_DEFAULTS.site_url}/tools`,
    screenshot: tool.screenshot || SEO_DEFAULTS.og_image.default,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: SEO_DEFAULTS.site_name,
      url: SEO_DEFAULTS.site_url,
    },
  };
}

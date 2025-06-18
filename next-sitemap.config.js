/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://studio.moikas.com",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    "/admin",
    "/admin/*",
    "/sign-in",
    "/sign-in/*",
    "/sign-up",
    "/sign-up/*",
    "/api/*",
    "/tools/age-verification",
    "/contact/privacy", // This is a form, not a content page
  ],
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/sign-in",
          "/sign-up",
          "/tools/age-verification",
          "/_next",
          "/static",
        ],
      },
    ],
  },
  // Custom transform function to set priorities
  transform: async (config, path) => {
    // Default config
    const default_config = {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };

    // Set custom priorities based on page importance
    if (path === "/") {
      return { ...default_config, priority: 1.0, changefreq: "daily" };
    }

    // Tool pages - high priority
    if (path.startsWith("/tools/")) {
      if (path === "/tools" || path === "/tools/create") {
        return { ...default_config, priority: 0.9, changefreq: "daily" };
      }
      return { ...default_config, priority: 0.8, changefreq: "weekly" };
    }

    // Important pages
    if (path === "/pricing" || path === "/buy-tokens") {
      return { ...default_config, priority: 0.8, changefreq: "weekly" };
    }

    // Legal pages - lower priority but important for SEO
    if (["/privacy-policy", "/terms-of-service", "/dmca", "/cookie-policy"].includes(path)) {
      return { ...default_config, priority: 0.5, changefreq: "monthly" };
    }

    // Status page
    if (path === "/status") {
      return { ...default_config, priority: 0.4, changefreq: "hourly" };
    }

    return default_config;
  },
};

import withPWA from "next-pwa";

const next_config = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development",
  },
  env: {
    STRIPE_PRICING_TABLE_ID: process.env.STRIPE_PRICING_TABLE_ID,
    STRIPE_PUB_KEY: process.env.STRIPE_PUB_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  // Configure larger body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '512mb',
    },
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(next_config);

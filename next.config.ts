import withPWA from 'next-pwa';

const next_config = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development",
  },
  env: {
    STRIPE_PRICING_TABLE_ID: process.env.STRIPE_PRICING_TABLE_ID,
    STRIPE_PUB_KEY: process.env.STRIPE_PUB_KEY,
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(next_config);

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PWA Support

This project is a Progressive Web App (PWA) using [next-pwa](https://github.com/shadowwalker/next-pwa). It supports offline usage, installability, and fast loading.

- Manifest and icons are in `public/manifest.json` and `public/icons/`.
- Service worker is auto-generated in production builds.
- To test PWA features:
  1. Run `bun run build` and `bun run start`.
  2. Open [http://localhost:3000](http://localhost:3000) in Chrome.
  3. Open DevTools > Application > Manifest to verify installability.
  4. Enable "Offline" in DevTools > Network to test offline support.

## SEO Improvements

- Unique metadata, Open Graph, and Twitter tags are set in `src/app/layout.tsx`.
- Sitemap and robots.txt are generated using [next-sitemap](https://github.com/iamvishnusankar/next-sitemap).
- After each build, `sitemap.xml` and `robots.txt` are available in the `public/` directory.
- Semantic HTML and accessibility best practices are used throughout the UI components.

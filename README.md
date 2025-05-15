# Studio Moikas

A modern creative studio app with AI-powered image generation, authentication, subscriptions, and analytics. Built with Next.js 15, React 19, Bun, Tailwind CSS, DaisyUI, Clerk, Supabase, and fal.ai.

## Features

- **AI Image Generation**: Generate images using fal.ai models (FLUX.1 [dev], [schnell])
- **Authentication & Subscriptions**: User auth and plans via Clerk
- **Token System**: Free and paid megapixel (MP) usage tracked in Supabase
- **PWA**: Installable, offline support, manifest and icons
- **Vercel Analytics**: Anonymous usage analytics with user opt-out
- **Cookie Consent**: Banner for privacy compliance
- **SEO**: Metadata, Open Graph, Twitter cards, sitemap, robots.txt
- **Responsive UI**: Tailwind CSS + DaisyUI

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Bun](https://bun.sh/) (runtime)
- [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- [Clerk](https://clerk.com/) (auth, subscriptions)
- [Supabase](https://supabase.com/) (database)
- [fal.ai](https://fal.ai/) (AI image generation)
- [@vercel/analytics](https://vercel.com/docs/analytics)

## Getting Started

1. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Run the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

3. **Build for production**
   ```bash
   bun run build
   # or
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

## Scripts

- `dev` — Start dev server with Turbopack
- `build` — Build for production
- `start` — Start production server
- `lint` — Run ESLint
- `postbuild` — Generate sitemap/robots.txt
- `supabase:*` — Supabase CLI commands

## PWA Support
- Manifest and icons in `public/`
- Service worker auto-generated in production
- Test: build, start, open in Chrome, check DevTools > Application > Manifest

## Analytics & Privacy
- Anonymous analytics via Vercel Analytics
- Users can opt out via the toggle in the site footer (see Privacy Policy)
- Cookie consent banner for compliance

## Environment Variables
- See `.env.example` for required variables (Clerk, Supabase, fal.ai, etc.)
- For local Supabase, see `supabase/config.toml`

## Deployment
- Deploy on [Vercel](https://vercel.com/)
- PWA, analytics, and SEO features work out of the box

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [fal.ai Docs](https://fal.ai/docs)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

© 2024 Studio Moikas. All rights reserved.

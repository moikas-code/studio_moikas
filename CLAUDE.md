# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

### Database Management
- `bun run supabase:start` - Start local Supabase instance
- `bun run supabase:stop` - Stop local Supabase instance
- `bun run supabase:reset` - Reset local database
- `bun run supabase:gen-types` - Generate TypeScript types from database schema
- `bun run supabase:seed` - Seed local database
- `bun run supabase:link` - Link to remote Supabase project

### Testing Webhooks Locally
- `bun run dev:tunnel` - Start Cloudflare tunnel for webhook testing
- `bun run tunnel` - Alternative tunnel command

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Runtime**: Bun (faster than Node.js)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **AI**: fal.ai for image generation, Langchain/langraph for LLM Agent development using grok-3-mini-latest
- **Payments**: Stripe
- **Caching**: Upstash Redis

### Key Architectural Patterns

1. **Token System (Mana Points)**
   - Users have renewable tokens (monthly allowance) and permanent tokens (purchased)
   - Deduction happens in database function `deduct_tokens()` - renewable first, then permanent
   - Free users: 125 MP/month, Standard: 20480 MP/month

2. **Image Generation Flow**
   - Component: `src/app/components/image_generator.tsx`
   - API: `/api/generate/route.ts`
   - Cache check → Token validation → fal.ai call → Refund on failure
   - Free users get watermark overlay applied server-side

3. **Rate Limiting**
   - Implemented in `/api/generate/route.ts` using Upstash Redis
   - Standard users: 60 requests/minute
   - Free users: 10 requests/minute + 2s queue delay

4. **Database Schema**
   - `users` table: Links Clerk ID to internal user ID
   - `subscriptions` table: Manages plan type and token balances
   - `usage` table: Tracks token consumption
   - RLS policies ensure users can only access their own data

5. **Webhook Integration**
   - Clerk webhooks: `/api/webhooks/clerk/route.ts` - User creation/updates
   - Stripe webhooks: `/api/webhooks/stripe/route.ts` - Subscription management
   - fal.ai webhooks: `/api/webhooks/fal-ai/route.ts` - Job completion

### Important Implementation Details

- **Model Configuration**: Available models are defined in `/api/generate/route.ts` with specific token costs
- **Advanced Settings**: SANA model supports inference steps, CFG scale, style presets, and seed control
- **Caching Strategy**: Redis with 1-hour TTL for generated images, key format: `image:${userId}:${promptHash}`
- **Error Handling**: Automatic token refund on generation failure
- **State Management**: MpContext in `/context/mp_context.tsx` for client-side token display

### Environment Variables Required
- Clerk: `NEXT_PUBLIC_CLERK_*` and `CLERK_SECRET_KEY`
- Supabase: `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY`
- fal.ai: `FAL_KEY`
- Stripe: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Redis: `UPSTASH_REDIS_REST_*`

### Development Tips
- Always check user authentication and token balance before expensive operations
- Use the existing Redis client for any caching needs
- Follow the established pattern for new API routes (auth check → rate limit → process → response)
- Database operations should use server-side Supabase client with service role
- Client components should use `useAuth()` from Clerk for user context
- Use Snake Case
- Follow DRY Programming
- Build Code that helps the world grow, and help people be more creative
- Keep Hooks, Helper, and Utility max 60 lines
- Avoid Recursion
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run postbuild` - Generate sitemap after build
- `bun run storybook` - Start Storybook on port 6006
- `bun run build-storybook` - Build Storybook

### Database Management
- `bun run supabase:login` - Login to Supabase
- `bun run supabase:start` - Start local Supabase instance
- `bun run supabase:stop` - Stop local Supabase instance
- `bun run supabase:status` - Check Supabase status
- `bun run supabase:db:pull` - Pull database schema from remote
- `bun run supabase:db:push` - Push local schema to remote
- `bun run supabase:db:reset` - Reset local database
- `bun run supabase:migration:up` - Run migrations forward
- `bun run supabase:migration:down` - Rollback migrations
- `bun run supabase:gen-types` - Generate TypeScript types from database schema
- `bun run supabase:seed` - Seed local database
- `bun run supabase:link` - Link to remote Supabase project

### Testing Webhooks Locally
- `bun run tunnel:init` - Initialize Cloudflare tunnel
- `bun run tunnel:login` - Login to Cloudflare tunnel
- `bun run tunnel:start` - Start tunnel for webhook testing
- `bun run dev:tunnel` - Start Cloudflare tunnel for webhook testing
- `bun run tunnel` - Alternative tunnel command

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Runtime**: Bun (faster than Node.js)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **AI**: fal.ai for image/video generation, xAI (Grok) with LangChain/LangGraph for multi-agent workflows
- **Payments**: Stripe
- **Caching**: Upstash Redis
- **PWA**: next-pwa for Progressive Web App support

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
   - `video_jobs`, `audio_jobs` tables: Async job tracking with webhook support
   - `workflows`, `workflow_nodes` tables: Visual workflow definitions
   - `workflow_sessions`, `workflow_messages` tables: Chat history and state
   - `billing_transactions` table: Payment and refund tracking
   - RLS policies ensure users can only access their own data

5. **Webhook Integration**
   - Clerk webhooks: `/api/webhooks/clerk/route.ts` - User creation/updates
   - Stripe webhooks: `/api/webhooks/stripe/route.ts` - Subscription management
   - fal.ai webhooks: `/api/webhooks/fal-ai/route.ts` - Job completion for video/audio

### Important Implementation Details

- **Model Configuration**: Available models are defined in `/api/generate/route.ts` with specific token costs
- **Advanced Settings**: SANA model supports inference steps, CFG scale, style presets, and seed control
- **Caching Strategy**: Redis with 1-hour TTL for generated images, key format: `image:${userId}:${promptHash}`
- **Error Handling**: Automatic token refund on generation failure
- **State Management**: MpContext in `/context/mp_context.tsx` for client-side token display
- **Job Storage**: Browser-based job storage for video/audio processing history
- **Webhook Security**: Signature verification for all webhook endpoints
- **Database Functions**: `deduct_tokens()` for token management, `refund_tokens()` for failures
- **Security Migrations**: Critical RLS fixes must be applied (see migrations folder)

### Environment Variables Required
- Clerk: `NEXT_PUBLIC_CLERK_*` and `CLERK_SECRET_KEY`
- Supabase: `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY`
- fal.ai: `FAL_KEY`
- xAI: `XAI_API_KEY` (for MEMU multi-agent system)
- Stripe: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Redis: `UPSTASH_REDIS_REST_*`
- Cloudflare: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_TUNNEL_SECRET` (for webhook testing)

## Multi-Tool Platform Structure

### 1. **Image Generator** (`/tools/create`)
- Multiple AI models: FLUX (3 variants), SANA, Stable Diffusion
- Advanced settings per model (CFG scale, inference steps, style presets)
- Watermark overlay for free users applied server-side
- Aspect ratio controls and model-specific features

### 2. **Video Effects** (`/tools/video-effects`)
- AI-powered video generation and restoration
- Webhook-based async processing with fal.ai
- Job history tracking with browser storage
- Restore functionality for completed jobs

### 3. **Audio Tools** (`/tools/audio`)
- Text-to-speech with multiple voices
- Voice cloning capabilities
- Document-to-audio conversion (PDF/DOCX support)
- Chunked audio generation for long texts
- Real-time voice recording

### 4. **MEMU System** (`/tools/memu`)
- Multi-agent workflow orchestration
- Visual workflow editor with node-based interface
- Pre-built templates for common tasks
- Dynamic tool generation from workflow nodes
- Agent types: Planner, Executor, Coordinator, Summarizer

### 5. **Text Analyzer** (`/tools/text-analyzer`)
- Content analysis and insights
- Session-based conversation history
- Token usage tracking

## API Route Patterns

All API routes follow a consistent pattern:
1. Authentication check using Clerk
2. Rate limiting with Redis (plan-based limits)
3. Token balance validation
4. Process request
5. Deduct tokens on success / refund on failure
6. Return structured response

## Testing Patterns

- Unit tests for individual functions and utilities
- Integration tests for API endpoints
- Component tests with Storybook
- Webhook testing with Cloudflare tunnels
- Database testing with local Supabase

## Code Organization

- **Hooks**: Custom React hooks in `/hooks` and component-specific `hooks/` folders
- **Utils**: Shared utilities in `/lib/utils/` with sub-categories (api, database, security)
- **Types**: TypeScript types in `/types` and component-specific `types/` folders
- **AI Agents**: Modular agent system in `/lib/ai-agents/`
- **Components**: Feature-based organization with co-located tests

### Development Tips
- Always check user authentication and token balance before expensive operations
- Use the existing Redis client for any caching needs
- Follow the established pattern for new API routes (auth check → rate limit → process → response)
- Database operations should use server-side Supabase client with service role
- Client components should use `useAuth()` from Clerk for user context
- Use snake_case for variables/functions (except React hooks)
- Follow DRY programming principles
- Keep hooks, helpers, and utilities under 60 lines
- Avoid recursion and complex flow constructs
- Run lint and type checks before committing
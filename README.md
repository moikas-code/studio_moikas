# Studio Moikas

[![Status](https://img.shields.io/badge/status-early%20access-blue)](https://studio.moikas.com/status)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8)](https://tailwindcss.com/)

> **Professional AI tools with a simple interface**

Studio Moikas is a comprehensive AI-powered creative platform that combines multiple AI tools into one seamless experience. Generate images, create videos, clone voices, build AI workflows, and more - all with transparent pricing and no hidden fees.

## 🌟 Features

### 🎨 **Image Generation**

- **Multiple AI Models**: FLUX Pro, SANA, Stable Diffusion, and custom LoRA models
- **Advanced Controls**: CFG scale, inference steps, style presets, aspect ratios
- **Custom Models**: Upload and use your own LoRA models
- **High Quality**: Professional-grade outputs with no generation limits

### 🎬 **Video Effects**

- **AI Video Generation**: Create videos from text prompts
- **Video Enhancement**: Restore and improve existing videos
- **Real-time Processing**: Async job system with webhook integration
- **Multiple Formats**: Support for various video formats and resolutions

### 🎙️ **Audio Studio**

- **Text-to-Speech**: Multiple AI voices with natural intonation
- **Voice Cloning**: Create custom voice models from samples
- **Document Narration**: Convert PDFs and documents to audio
- **Chunked Processing**: Handle long-form content efficiently

### 🤖 **MEMU Workflow System**

- **Visual Workflow Editor**: Drag-and-drop AI agent orchestration
- **Multi-Agent Coordination**: Planner, Executor, Coordinator agents
- **Pre-built Templates**: Ready-to-use workflows for common tasks
- **Custom Tools**: Build and integrate your own AI tools

### 🖼️ **Image Editor**

- **Layer-based Editing**: Professional image editing capabilities
- **Text Overlays**: Add and customize text on images
- **AI Enhancements**: Integrate AI-powered editing features
- **Export Options**: Multiple format support

### 📝 **Text Analyzer**

- **Content Generation**: Scripts, summaries, social media posts
- **Text Analysis**: Sentiment analysis and content insights
- **Multi-format Output**: Generate content for various platforms
- **Session History**: Track and manage your text projects

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (we recommend using [Bun](https://bun.sh) for faster performance)
- **PostgreSQL** database (we use [Supabase](https://supabase.com))
- **Redis** instance (we use [Upstash](https://upstash.com))

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/moikas-code/studio_moikas.git
   cd studio_moikas
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following services:

   - **Supabase**: Database and authentication
   - **Clerk**: User management and authentication
   - **fal.ai**: AI model infrastructure
   - **Stripe**: Payment processing
   - **Upstash Redis**: Caching and rate limiting
   - **xAI (Grok)**: Multi-agent AI workflows

4. **Start local development**

   ```bash
   # Start local Supabase
   bun run supabase:start

   # Run database migrations
   bun run supabase:db:reset

   # Start development server
   bun run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Supabase Studio: http://localhost:54323
   - Status Page: http://localhost:3000/status

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Runtime**: Bun (faster than Node.js)
- **Styling**: Tailwind CSS v4 + DaisyUI with macOS-inspired design
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Clerk with custom age verification
- **AI Services**: fal.ai for image/video, xAI (Grok) for text and workflows
- **Payments**: Stripe with subscription management
- **Caching**: Upstash Redis for performance and rate limiting
- **PWA**: Progressive Web App support with offline capabilities

### Key Components

- **Token System (Mana Points)**: Universal currency across all tools
- **Job System**: Async processing with webhook integration
- **Rate Limiting**: Plan-based request limits with Redis
- **Health Monitoring**: Real-time service status tracking
- **Security**: Comprehensive RLS policies and data protection

## 💰 Pricing Model

Studio Moikas uses a transparent **Mana Points (MP)** system:

- **Free Plan**: 125 MP/month + basic features
- **Standard Plan**: $20/month for 20,480 MP + premium features
- **Pay-as-you-go**: From $2 for additional tokens that never expire

### Token Costs (Base Rates)

- **Image Generation**: 1-320 MP (varies by model)
- **Video Effects**: 750 MP/second
- **Text-to-Speech**: 25 MP per 250 characters
- **MEMU Workflows**: 5-15 MP per operation

_Free users pay 4x base cost, Standard users pay 1.5x base cost_

## 🛠️ Development Commands

```bash
# Development
bun run dev              # Start development server with Turbopack
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Run ESLint
bun run type-check      # Run TypeScript checks

# Database
bun run supabase:start  # Start local Supabase
bun run supabase:stop   # Stop local Supabase
bun run supabase:reset  # Reset database with fresh migrations
bun run supabase:pull   # Pull schema from remote
bun run supabase:push   # Push local schema to remote

# Testing & Quality
bun run storybook       # Start Storybook component library
bun run test            # Run test suite (when available)

# Webhooks (for local development)
bun run tunnel:start    # Start Cloudflare tunnel for webhook testing
bun run dev:tunnel      # Start dev server with tunnel
```

## 📊 Project Status

Studio Moikas is currently in **Early Access** with active development:

- ✅ **Core Features**: Image generation, video effects, audio tools
- ✅ **MEMU System**: AI workflow orchestration
- ✅ **Authentication**: Age verification and user management
- ✅ **Payment System**: Stripe integration with token system
- ✅ **macOS Design**: Beautiful, responsive interface
- 🚧 **Mobile App**: React Native version in development
- 🚧 **API Access**: Public API for developers
- 🚧 **Marketplace**: Community models and workflows

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our code style (snake_case for variables/functions, DRY principles)
4. Run tests and linting: `bun run lint && bun run type-check`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [studio.moikas.com](https://studio.moikas.com)
- **Status Page**: [studio.moikas.com/status](https://studio.moikas.com/status)
- **Documentation**: [docs.studio.moikas.com](https://docs.studio.moikas.com) _(coming soon)_
- **Support**: [@moikas_official](https://x.com/moikas_official) on X (Twitter)
- **Privacy Policy**: [studio.moikas.com/privacy-policy](https://studio.moikas.com/privacy-policy)

## 🚨 Security

If you discover a security vulnerability, please send an email to security@moikas.com. All security vulnerabilities will be promptly addressed.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

---

<div align="center">

**Built with ❤️ by the Moikas team**

_Empowering creators with professional AI tools_

</div>

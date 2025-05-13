# Building a Studio App with Image Generation MVP

This document outlines the development plan for your studio app, focusing on image generation as the MVP feature, using fal.ai’s FLUX.1 [dev] model, and implementing a hybrid monetization model. The app will be built with Next.js, Bun, Tailwind + DaisyUI, Clerk, Supabase, and fal.ai via AI SDK, with coding assisted by Cursor.

## 1. Project Overview

### Objective
Create a web-based studio app for creative tasks, starting with image generation (editing, memes, thumbnails, avatars), with plans to add GIFs, videos, and audio later. Monetize the MVP using a free tier, a $20/month subscription, and token purchases, leveraging fal.ai for AI generation.

### Why Image Generation?
- **Market Demand**: Image generation is highly popular, with tools like Midjourney generating millions of images daily (https://stockimg.ai/blog/ai-and-technology/what-is-flux-and-models-comparison).
- **Cost Efficiency**: fal.ai’s image models (e.g., FLUX.1 [dev] at $0.025/MP) are cheaper than video models (e.g., $0.5/video second) (https://fal.ai/pricing).
- **Monetization Fit**: Free image edits (if no API cost) and token-based usage align with your hybrid model.

### Tech Stack
- **Frontend**: Next.js for a fast, server-rendered React app.
- **Runtime**: Bun for improved performance over Node.js.
- **Styling**: Tailwind CSS + DaisyUI for rapid, responsive UI development.
- **Authentication/Billing**: Clerk for user management and subscriptions.
- **Database**: Supabase for scalable, real-time data storage.
- **AI**: fal.ai via AI SDK for image generation (https://ai-sdk.dev/providers/ai-sdk-providers/fal#fal-provider).

## 2. Choosing the fal.ai Model

### Model Selection
The **FLUX.1 [dev]** model is recommended for the MVP:
- **Description**: A 12B parameter flow transformer for high-quality text-to-image generation, suitable for commercial use via fal.ai’s API (https://fal.ai/).
- **Pricing**: $0.025 per megapixel, allowing 3000 MP with your $75 budget (https://fal.ai/pricing).
- **Quality**: Offers superior detail, realism, and prompt adherence compared to FLUX.1 [schnell], especially for skin textures and lighting (https://www.stablediffusiontutorials.com/2025/04/flux-schnell-dev-pro.html).
- **Licensing**: While FLUX.1 [dev] is non-commercial in its open-source form, fal.ai’s terms allow commercial use through their API (https://fal.ai/terms).
- **Alternatives**:
  - **FLUX.1 [schnell]**: Cheaper ($0.003/MP) but compromises on quality, suitable for speed-focused tasks (https://stockimg.ai/blog/ai-and-technology/what-is-flux-and-models-comparison).
  - **FLUX.1 [pro]**: Higher quality but more expensive ($0.05/MP), less cost-effective for the MVP.
  - **Stable Diffusion 3 - Medium**: $0.035 per image, less flexible for varying resolutions.

### Budget Analysis
- **$75 Budget**: 3000 MP at $0.025/MP, sufficient for testing and early users.
- **Free Tier**: 100 MP/user/month costs $2.50, sustainable for many users.
- **Paid Tier**: 500 MP for $20 costs $12.50, yielding $7.50 profit/user (before other costs).

## 3. Monetization Strategy

### Hybrid Model
- **Free Tier**: 100 MP/month (cost: $2.50/user).
- **Paid Tier**: $20/month for 500 MP (cost: $12.50, profit: $7.50).
- **Token Purchases**: 100 MP for $2.50, allowing users to top up.
- **Free Edits**: Basic image edits (e.g., resizing, cropping) are free if they don’t incur API costs, implemented client-side using libraries like Fabric.js.

### Token Definition
- **Token = 1 MP**: Simplifies tracking, as fal.ai prices images per megapixel.
- **Example**:
  - A 1MP image generation costs 1 token ($0.025).
  - Free tier users get 100 tokens/month.
  - Paid users get 500 tokens/month.

## 4. Development Plan

### 4.1 Project Setup
- **Initialize Next.js with Bun**:
  - Use `bun create next-app studio-app` to set up the project.
  - Configure Bun as the runtime for faster performance.
- **Add Styling**:
  - Install Tailwind CSS and DaisyUI for responsive, component-based UI.
  - Configure `tailwind.config.js` to include DaisyUI themes.
- **Directory Structure**:
  ```
  studio-app/
  ├── app/
  │   ├── api/
  │   ├── page.tsx
  │   ├── layout.tsx
  ├── components/
  ├── lib/
  ├── public/
  ├── tailwind.config.js
  ├── bun.lockb
  ├── package.json
  ```

### 4.2 Authentication and Billing
- **Clerk Setup**:
  - Install `@clerk/nextjs` and configure authentication.
  - Set up subscription plans:
    - Free: 100 MP/month.
    - Pro: 500 MP/month for $20.
  - Use Clerk’s webhooks to update Supabase on subscription changes.

### 4.3 Database Setup
- **Supabase**:
  - Install `@supabase/supabase-js`.
  - Create tables:
    ```sql
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      clerk_id TEXT UNIQUE,
      email TEXT
    );

    CREATE TABLE subscriptions (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      plan TEXT, -- 'free' or 'pro'
      tokens INTEGER, -- MP available
      renewed_at TIMESTAMP
    );

    CREATE TABLE usage (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      tokens_used INTEGER, -- MP consumed
      created_at TIMESTAMP
    );
    ```

### 4.4 fal.ai Integration
- **AI SDK**:
  - Install `ai` package and configure fal.ai provider.
  - Set up environment variable `FAL_KEY` for API access.
- **Image Generation**:
  - Use `fal-ai/flux/dev` for text-to-image generation.
  - Example API call:
    ```javascript
    import { generateImage } from 'ai';

    async function generate(prompt) {
      const result = await generateImage({
        model: 'fal-ai/flux/dev',
        prompt,
        width: 1024,
        height: 1024
      });
      return result.imageUrl;
    }
    ```

### 4.5 Image Generation Feature
- **UI**:
  - Create a React component for prompt input and image display.
  - Use DaisyUI components for styling.
- **Backend**:
  - API route to handle generation requests.
  - Check token balance, call fal.ai, deduct tokens, and store usage.
- **Example Component**:
  ```javascript
  'use client';

  import { useState } from 'react';
  import { Button, Input } from 'daisyui';

  export default function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    async function handleGenerate() {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      const { imageUrl } = await response.json();
      setImageUrl(imageUrl);
    }

    return (
      <div>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
        />
        <Button onClick={handleGenerate}>Generate</Button>
        {imageUrl && <img src={imageUrl} alt="Generated" />}
      </div>
    );
  }
  ```

### 4.6 Monetization Logic
- **Token Management**:
  - Check user’s token balance before generation.
  - Deduct MP based on image size (e.g., 1MP = 1 token).
  - Update `usage` table.
- **API Route**:
  ```javascript
  import { createClient } from '@supabase/supabase-js';
  import { generateImage } from 'ai';

  export async function POST(req) {
    const { prompt } = await req.json();
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data: user } = await supabase.auth.getUser();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tokens')
      .eq('user_id', user.id)
      .single();

    if (subscription.tokens < 1) {
      return new Response('Insufficient tokens', { status: 403 });
    }

    const result = await generateImage({
      model: 'fal-ai/flux/dev',
      prompt,
      width: 1024,
      height: 1024
    });

    await supabase
      .from('subscriptions')
      .update({ tokens: subscription.tokens - 1 })
      .eq('user_id', user.id);

    await supabase
      .from('usage')
      .insert({ user_id: user.id, tokens_used: 1 });

    return new Response(JSON.stringify({ imageUrl: result.imageUrl }));
  }
  ```

### 4.7 Testing and Deployment
- **Testing**:
  - Test authentication, image generation, and token deduction.
  - Ensure UI is responsive and user-friendly.
- **Deployment**:
  - Deploy to Vercel for seamless Next.js hosting.
  - Set up environment variables for Clerk, Supabase, and fal.ai.

## 5. Priority List
1. **Project Setup**: Initialize Next.js with Bun, add Tailwind + DaisyUI.
2. **Authentication**: Integrate Clerk for user management and subscriptions.
3. **Database**: Set up Supabase with user, subscription, and usage tables.
4. **fal.ai Integration**: Connect to FLUX.1 [dev] via AI SDK.
5. **Image Generation**: Build UI and backend for prompt-based image generation.
6. **Monetization**: Implement token system and subscription plans.
7. **Test and Deploy**: Ensure functionality and deploy to Vercel.

## 6. Initial Prompts for Cursor
Cursor, an AI-powered code editor, will streamline development (https://www.cursor-ide.com/). Use these prompts:
- "Create a new Next.js project using Bun as the runtime."
- "Add Tailwind CSS and DaisyUI to the Next.js project."
- "Set up Clerk for authentication and subscription management in the Next.js app."
- "Connect Supabase to the Next.js app and set up tables for users, subscriptions, and usage tracking."
- "Integrate fal.ai into the Next.js app using the AI SDK provider, specifically for image generation with the FLUX.1 [dev] model."
- "Create a React component with a text input for the prompt and a button to generate an image using the fal.ai API."
- "Implement logic to check the user’s token balance from Supabase, deduct the cost of image generation, and handle insufficient tokens."
- "Configure Clerk to have a free plan with 100 MP per month and a pro plan with 500 MP per month for $20."

## 7. Future Features
- **Image Editing**: Use models like `fal-ai/flux-lora/inpainting` for inpainting or client-side tools like Fabric.js for free edits.
- **Meme Creation**: Add text overlay functionality using Canvas API.
- **Thumbnails/Avatars**: Optimize image sizes and use subject-reference models.
- **Videos/GIFs**: Integrate models like `fal-ai/vidu/q1/text-to-video`.
- **Audio**: Use `fal-ai/minimax/speech-02-turbo` for text-to-speech.

## 8. Key Considerations
- **Scalability**: Monitor fal.ai usage to stay within budget as user base grows.
- **User Experience**: Ensure the UI is intuitive, with clear token balance displays.
- **Security**: Protect API keys and use Clerk’s secure authentication.

## 9. Budget and Cost Management
| Item                | Details                              | Cost Estimate       |
|---------------------|--------------------------------------|---------------------|
| fal.ai Credits      | 3000 MP at $0.025/MP                | $75 (initial budget) |
| Free Tier (per user)| 100 MP/month                        | $2.50/user          |
| Paid Tier (per user)| 500 MP/month                        | $12.50/user         |
| Hosting (Vercel)    | Basic plan for MVP                  | ~$20/month          |
| Supabase            | Free tier for initial users         | $0 (initially)      |
| Clerk               | Pay-per-user, estimate 100 users    | ~$25/month          |

## 10. Risk Assessment
- **Licensing Risks**: Ensure compliance with fal.ai’s commercial terms to avoid issues with FLUX.1 [dev] usage.
- **Cost Overruns**: Monitor API usage to prevent exceeding budget, especially with free tier users.
- **User Adoption**: Quality of FLUX.1 [dev] is critical; lower-quality alternatives like [schnell] may reduce user satisfaction.
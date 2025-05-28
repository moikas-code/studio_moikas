"use client";
import { SignedIn, SignedOut, PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Sliders,
  Zap,
  FlaskRound,
  ArrowRight,
  Brain,
  Palette,
  Code,
  Wand2,
  Lightbulb,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { track } from "@vercel/analytics";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-purple-100 to-white dark:from-[#35155D] dark:to-[#0a0a0a]">
      {/* Hero Section */}
      <section className="w-full min-h-[500px] flex flex-col items-center justify-center text-center pt-16 pb-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-jade/10 to-blackflame/10 dark:from-jade/5 dark:to-blackflame/5 z-0"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-jade/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blackflame/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-jade mb-4">
            Studio.Moikas
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto mb-6">
            Create stunning images from your imagination with AI-powered tools.
            Flexible, fast, and fun.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
            <SignedIn>
              <Link href="/tools/create">
                <button
                  className="btn btn-primary btn-lg text-lg px-8 py-3 shadow-lg animate-bounce focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => track("Landing-HERO-Start_Creating-Click")}
                >
                  Start Creating <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <button
                  className="btn btn-primary btn-lg text-lg px-8 py-3 shadow-lg animate-bounce focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => track("Landing-HERO-Get_Started-Click")}
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Animated Demo Section */}
      <section className="w-full min-h-[600px] md:min-h-[400px] flex flex-col items-center justify-start md:justify-center py-4 mt-4">
        <div className="w-full max-w-xl h-full flex flex-col-reverse md:flex-row items-center justify-between gap-4 py-4">
          {/* Simple animation: prompt to image */}
          <div className="-translate-y-1/2 flex flex-col items-center">
            <div className="bg-white dark:bg-base-200 border border-base-300 rounded-xl px-6 py-3 shadow-md text-lg font-mono animate-pulse">
              &quot;A cat astronaut on Mars&quot;
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 max-w-69 w-full h-1 bg-gradient-to-r from-purple-400 via-orange-400 to-pink-400 animate-gradient-x rounded-full" />
            <span className="mt-2 text-xs text-gray-400">Your prompt</span>
          </div>
          <div className="md:-translate-y-1/2 flex flex-col items-center">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl w-54 h-54 flex items-center justify-center shadow-lg animate-fade-in">
              <Image
                width={300}
                height={300}
                src="/A_cat_astronaut_on_Mars.png"
                alt="AI-generated image"
                className="w-50 h-50 text-white rounded shadow-md"
              />
            </div>
            <span className="mt-2 text-xs text-gray-400">
              AI-generated image
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                1. Describe Your Vision
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter a text prompt describing what you want to create. Be as
                detailed or abstract as you like.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-jade animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. AI Magic Happens</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our advanced AI models process your prompt and generate stunning
                visuals in seconds.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Get Amazing Results</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Download high-quality, unique images that bring your ideas to
                life. Refine and iterate as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12 px-4">
        {/* Feature 1: AI Image Generation */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Sparkles className="w-10 h-10 text-purple-500 mb-3 animate-spin-slow" />
          <h3 className="text-md font-bold mb-2">AI Image Generation</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Turn your ideas into visuals instantly using advanced AI models.
          </p>
        </div>
        {/* Feature 2: Flexible Aspect Ratios */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Sliders className="w-10 h-10 text-orange-500 mb-3 animate-wiggle" />
          <h3 className="text-md font-bold mb-2">Flexible Aspect Ratios</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Choose from a variety of aspect ratios to fit your creative needs.
          </p>
        </div>
        {/* Feature 3: Multiple AI Models */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Zap className="w-10 h-10 text-pink-500 mb-3 animate-pulse" />
          <h3 className="text-md font-bold mb-2">Multiple AI Models</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Access different AI models for unique styles and results.
          </p>
        </div>
        {/* Feature 4: Token-Based Usage */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <span title="Mana Points">
            <FlaskRound className="w-10 h-10 text-jade mb-3 animate-bounce" />
          </span>
          <h3 className="text-md font-bold mb-2">Mana Points System</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Track your creative power and manage your usage with Mana Points.
          </p>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Who Uses Studio.Moikas?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-base-300 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="h-48 bg-gradient-to-br from-jade/20 to-blackflame/20 relative">
                <Image
                  src="/digital-artist-ai.png"
                  alt="Digital artist creating concept art"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <h3 className="text-white text-xl font-bold p-4">
                    Digital Artists
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Generate concept art, illustrations, and creative assets in
                  seconds. Explore new styles without technical limitations.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-base-300 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="h-48 bg-gradient-to-br from-jade/20 to-blackflame/20 relative">
                <Image
                  src="/marketing-team-ai.png"
                  alt="Marketing team creating content"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <h3 className="text-white text-xl font-bold p-4">
                    Marketing Teams
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Create eye-catching social media content, ads, and marketing
                  materials without expensive design resources.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-base-300 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="h-48 bg-gradient-to-br from-jade/20 to-blackflame/20 relative">
                <Image
                  src="/ai-game-dev.png"
                  alt="Game developer creating assets"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <h3 className="text-white text-xl font-bold p-4">
                    Game Developers
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Rapidly prototype game assets, characters, environments, and
                  concept art to accelerate your development process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="w-full py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Powered by Advanced Technology
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2">State-of-the-Art AI</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our platform leverages the latest advancements in generative AI
                and deep learning to deliver exceptional results.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Code className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Optimized Infrastructure
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built on a scalable, high-performance backend that ensures fast
                generation times and reliable service.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2">Creative Algorithms</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Specialized models trained on diverse artistic styles and
                techniques to provide versatile creative outputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            What Our Users Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-base-300 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-jade/20 flex items-center justify-center mr-4">
                  <span className="text-jade font-bold">JK</span>
                </div>
                <div>
                  <h4 className="font-bold">Justine Kase</h4>
                  <p className="text-sm text-gray-500">Digital Artist</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                &quot;Studio.Moikas has completely transformed my workflow. I can
                explore concepts and ideas in minutes that would have taken days
                before.&quot;
              </p>
            </div>

            <div className="bg-white dark:bg-base-300 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-jade/20 flex items-center justify-center mr-4">
                  <span className="text-jade font-bold">MS</span>
                </div>
                <div>
                  <h4 className="font-bold">Mark Smith</h4>
                  <p className="text-sm text-gray-500">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                &quot;The speed and quality of the AI-generated images have allowed
                our small team to produce content at the scale of much larger
                companies.&quot;
              </p>
            </div>

            <div className="bg-white dark:bg-base-300 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-jade/20 flex items-center justify-center mr-4">
                  <span className="text-jade font-bold">AJ</span>
                </div>
                <div>
                  <h4 className="font-bold">Alex Johnson</h4>
                  <p className="text-sm text-gray-500">Indie Game Developer</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                &quot;As a solo developer, Studio.Moikas has been a game-changer. I
                can create professional-quality art assets without hiring a team
                of artists.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full flex flex-col items-center justify-center py-8 mt-4 bg-gradient-to-r from-jade/20 to-blackflame/20 dark:from-jade/10 dark:to-blackflame/10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to Transform Your Creative Process?
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Join thousands of creators who are already using Studio.Moikas to
            bring their ideas to life.
          </p>
          <SignedIn>
            <Link href="/tools/create">
              <button
                className="btn btn-secondary btn-lg text-lg px-8 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-secondary"
                onClick={() => track("Landing-CTA-Start_Creating_Now-Click")}
              >
                Start Creating Now <Wand2 className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up">
              <button
                className="btn btn-secondary btn-lg text-lg px-8 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-secondary"
                onClick={() => track("Landing-CTA-Sign_Up_Free-Click")}
              >
                Sign Up Free <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </SignedOut>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <div className="w-full max-w-3xl mx-auto">
            <SignedOut>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white dark:bg-base-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-2xl font-bold text-jade mb-2">Free</h3>
                  <p className="text-3xl font-bold mb-4">
                    $0<span className="text-lg text-gray-500">/month</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>125 Mana Points monthly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>Standard resolution images</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>Basic AI models</span>
                    </li>
                  </ul>
                  <Link href="/sign-up">
                    <button className="btn btn-outline w-full">
                      Get Started
                    </button>
                  </Link>
                </div>

                <div className="bg-white dark:bg-base-200 rounded-lg shadow-lg border border-jade p-6 relative">
                  <div className="absolute top-0 right-0 bg-jade text-white px-3 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                  <h3 className="text-2xl font-bold text-jade mb-2">
                    Standard
                  </h3>
                  <p className="text-3xl font-bold mb-4">
                    $19<span className="text-lg text-gray-500">/month</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>150 Mana Points monthly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>High resolution images</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>Premium AI models</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span>Priority generation</span>
                    </li>
                  </ul>
                  <Link href="/sign-up">
                    <button className="btn btn-primary w-full">
                      Get Started
                    </button>
                  </Link>
                </div>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="w-full max-w-3xl mx-auto [&>div]:h-full">
                <PricingTable
                  appearance={{
                    elements: {
                      pricingTable:
                        "w-full h-full flex flex-col md:flex-row gap-4 bg-white/80 dark:bg-base-200/80 rounded-xl shadow-lg p-6 border border-base-200",
                      pricingTableCard: "w-full",
                      pricingTablePlanCard:
                        "flex-1 min-w-0 w-100 p-4 md:p-6 rounded-lg shadow-md",
                      pricingTablePlanCardTitle:
                        "text-lg md:text-2xl font-bold text-primary",
                      pricingTablePlanCardPrice:
                        "text-2xl md:text-3xl font-bold",
                      formButtonPrimary:
                        "btn btn-primary btn-sm md:btn-md w-full mt-4",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-base-300 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-2">What is Studio.Moikas?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Studio.Moikas is an AI-powered creative studio that allows you
                to generate high-quality images from text descriptions. It&apos;s
                designed for artists, designers, marketers, and anyone who needs
                visual content.
              </p>
            </div>

            <div className="bg-white dark:bg-base-300 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-2">
                How does the Mana Points system work?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Mana Points (MP) are our credit system. Each image generation
                costs a certain number of MP depending on the model, resolution,
                and other parameters. Free users get 125 MP per month, while
                paid plans offer more MP and additional features.
              </p>
            </div>

            <div className="bg-white dark:bg-base-300 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-2">
                Can I use the generated images commercially?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, you own the rights to the images you generate with
                Studio.Moikas. You can use them for personal or commercial
                projects, subject to our terms of service regarding
                inappropriate content.
              </p>
            </div>

            <div className="bg-white dark:bg-base-300 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-2">
                What AI models do you use?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We use a variety of state-of-the-art generative AI models that
                are continuously updated to provide the best quality and most
                diverse outputs. Different models excel at different styles and
                types of content.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

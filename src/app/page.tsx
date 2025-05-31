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
  ChevronDown,
} from "lucide-react";
import { track } from "@vercel/analytics";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-jade/5 via-white to-jade/5 dark:from-blackflame dark:via-[#0a0a0a] dark:to-blackflame">
      {/* Hero Section */}
      <section className="w-full min-h-[500px] flex flex-col items-center justify-center text-center pt-16 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jade/5 via-transparent to-blackflame/5 dark:from-jade/5 dark:via-transparent dark:to-blackflame/5 z-0"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-jade/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blackflame/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-jade/10 dark:bg-jade/20 rounded-full text-xs font-medium text-jade mb-4 animate-fade-in">
            <Sparkles className="w-3 h-3" />
            AI-Powered Creative Studio
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-jade via-jade-dark to-blackflame bg-clip-text dark:text-white animate-fade-in">
            Studio.Moikas
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in animation-delay-200">
            Transform your ideas into stunning visuals with cutting-edge AI.
            <span className="block mt-1 text-base text-gray-600 dark:text-gray-400">Fast • Flexible • Professional</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in animation-delay-400">
            <SignedIn>
              <Link href="/tools/create">
                <button
                  className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  onClick={() => track("Landing-HERO-Start_Creating-Click")}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    Start Creating
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <button
                  className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  onClick={() => track("Landing-HERO-Get_Started-Click")}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
              <Link href="/pricing">
                <button className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium text-jade dark:text-jade-dark bg-transparent border-2 border-jade dark:border-jade-dark rounded-full hover:bg-jade/10 dark:hover:bg-jade/20 transition-all duration-300">
                  View Pricing
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Animated Demo Section */}
      <section className="w-full py-8 px-4 relative overflow-hidden bg-gradient-to-b from-transparent via-jade/5 to-transparent dark:via-jade/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            See The Magic In Action
          </h2>
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
            {/* Prompt Input */}
            <div className="flex flex-col items-center relative group">
              <div className="bg-white dark:bg-base-200 border border-jade/20 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <p className="text-base font-mono text-gray-800 dark:text-gray-200">
                  &quot;A cat astronaut on Mars&quot;
                </p>
              </div>
              <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Your prompt</span>
            </div>
            
            {/* Animated Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-20">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-0.5 bg-gradient-to-r from-jade via-jade-dark to-jade animate-pulse"></div>
                </div>
                <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-jade animate-pulse" />
              </div>
            </div>
            <div className="lg:hidden">
              <ArrowRight className="w-6 h-6 text-jade rotate-90 animate-bounce" />
            </div>
            
            {/* Generated Image */}
            <div className="flex flex-col items-center relative group">
              <div className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-blackflame/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  width={95}
                  height={95}
                  src="/A_cat_astronaut_on_Mars.png"
                  alt="AI-generated cat astronaut on Mars"
                  className="w-full h-full object-cover"
                  priority
                />
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded px-2 py-0.5 z-20">
                  <span className="text-xs font-medium text-white">AI Generated</span>
                </div>
              </div>
              <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Your result</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-8 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
                <Lightbulb className="w-7 h-7 text-jade" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                1. Describe
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter a text prompt describing what you want to create
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
                <Brain className="w-7 h-7 text-jade animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">2. Generate</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI models process your prompt and create visuals in seconds
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
                <Rocket className="w-7 h-7 text-jade" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">3. Download</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get high-quality images ready for your projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Powerful Features
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Everything you need to create stunning AI art
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1: AI Image Generation */}
            <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">AI Generation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Turn ideas into visuals instantly with advanced AI
              </p>
            </div>
            
            {/* Feature 2: Flexible Aspect Ratios */}
            <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Sliders className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Flexible Sizes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Multiple aspect ratios for any creative need
              </p>
            </div>
            
            {/* Feature 3: Multiple AI Models */}
            <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Multiple Models</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Various AI models for unique styles
              </p>
            </div>
            
            {/* Feature 4: Token-Based Usage */}
            <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className="w-12 h-12 bg-jade/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <FlaskRound className="w-6 h-6 text-jade" />
              </div>
              <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Mana Points</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Flexible credit system for all users
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Built For Creative Professionals
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Join thousands of creators transforming their workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/digital-artist-ai.png"
                  alt="Digital artist creating concept art"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">
                      Digital Artists
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate concept art and illustrations in seconds. Explore new styles effortlessly.
                </p>
                <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/marketing-team-ai.png"
                  alt="Marketing team creating content"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">
                      Marketing Teams
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create social media content and ads at scale without expensive resources.
                </p>
                <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/ai-game-dev.png"
                  alt="Game developer creating assets"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Code className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">
                      Game Developers
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Rapidly prototype game assets and environments to accelerate development.
                </p>
                <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
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
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">State-of-the-Art AI</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our platform leverages the latest advancements in generative AI
                and deep learning to deliver exceptional results.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
                <Code className="w-8 h-8 text-jade" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
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
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Creative Algorithms</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Specialized models trained on diverse artistic styles and
                techniques to provide versatile creative outputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-b from-transparent via-white/50 to-transparent dark:from-transparent dark:via-base-200/50 dark:to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Loved By Creators Worldwide
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of satisfied users who are creating amazing content daily
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                  <span className="dark:text-white text-black font-bold text-lg">JK</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Justine Kase</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Digital Artist</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                &quot;Studio.Moikas has completely transformed my workflow. I can
                explore concepts and ideas in minutes that would have taken days
                before. The quality is consistently amazing.&quot;
              </p>
            </div>

            <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                  <span className="dark:text-white text-black font-bold text-lg">MS</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Mark Smith</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Director</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                &quot;The speed and quality of AI-generated images have allowed
                our small team to produce content at the scale of much larger
                companies. ROI has been incredible.&quot;
              </p>
            </div>

            <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                  <span className="dark:text-white text-black font-bold text-lg">AJ</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Alex Johnson</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Indie Game Developer</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                &quot;As a solo developer, Studio.Moikas has been a game-changer. I
                can create professional-quality art assets without hiring a team
                of artists. Essential tool!&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jade/20 via-jade/10 to-blackflame/20 dark:from-jade/10 dark:via-jade/5 dark:to-blackflame/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-jade/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blackflame/20 rounded-full filter blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full text-sm font-medium text-jade mb-6">
            <Rocket className="w-4 h-4" />
            Limited Time Offer
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of creators who are transforming their ideas into stunning visuals with Studio.Moikas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <Link href="/tools/create">
                <button
                  className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  onClick={() => track("Landing-CTA-Start_Creating_Now-Click")}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    Start Creating Now
                    <Wand2 className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                </button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-up">
                <button
                  className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  onClick={() => track("Landing-CTA-Sign_Up_Free-Click")}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            </SignedOut>
          </div>
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            No credit card required • 125 free Mana Points monthly
          </p>
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
                  <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    $0<span className="text-lg text-gray-500">/month</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">125 Mana Points monthly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Standard resolution images</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Basic AI models</span>
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
                  <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    $19<span className="text-lg text-gray-500">/month</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">150 Mana Points monthly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">High resolution images</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Premium AI models</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Priority generation</span>
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
      <section className="w-full py-20 px-4 bg-white/80 dark:bg-base-200/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about Studio.Moikas
            </p>
          </div>

          <div className="space-y-4">
            <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <summary className="flex items-center justify-between p-6 cursor-pointer">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                  What is Studio.Moikas?
                </h3>
                <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Studio.Moikas is an AI-powered creative studio that allows you
                  to generate high-quality images from text descriptions. It&apos;s
                  designed for artists, designers, marketers, and anyone who needs
                  visual content. Our platform offers multiple AI models, flexible pricing,
                  and professional-quality results.
                </p>
              </div>
            </details>

            <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <summary className="flex items-center justify-between p-6 cursor-pointer">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                  How does the Mana Points system work?
                </h3>
                <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Mana Points (MP) are our flexible credit system. Each image generation
                  costs MP based on the model, resolution, and parameters used.
                  Free users receive 125 MP monthly (renewed automatically), while
                  Standard users get 150 MP monthly plus the ability to purchase additional
                  permanent MP as needed.
                </p>
              </div>
            </details>

            <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <summary className="flex items-center justify-between p-6 cursor-pointer">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                  Can I use the generated images commercially?
                </h3>
                <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Yes! You own full commercial rights to all images you generate with
                  Studio.Moikas. Use them for personal projects, client work, products,
                  marketing materials, or any other purpose. The only restriction is
                  creating inappropriate or illegal content as outlined in our terms of service.
                </p>
              </div>
            </details>

            <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <summary className="flex items-center justify-between p-6 cursor-pointer">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                  What AI models are available?
                </h3>
                <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We offer multiple state-of-the-art AI models including FLUX, SANA, and more.
                  Each model has unique strengths - some excel at photorealism, others at
                  artistic styles. Premium models offer higher quality and more control
                  over generation parameters. We continuously add new models as they become available.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

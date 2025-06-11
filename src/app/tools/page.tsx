"use client";
import React, { useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { MpContext } from "../../context/mp_context";
import { FaImage, FaVideo, FaFileAlt, FaStar, FaCoins, FaRocket, FaEdit, FaRobot, FaMicrophone, FaLock } from "react-icons/fa";
import Link from "next/link";

export default function Tools_home_page() {
  const { user, isLoaded } = useUser();
  const { mp_tokens, is_loading_tokens, token_error, plan } = useContext(MpContext);
  const username = user?.username || user?.firstName || user?.lastName || user?.emailAddresses?.[0]?.emailAddress || "User";

  const tools = [
    {
      title: "Audio",
      description: "Convert text to speech, record, and edit audio with AI",
      icon: FaMicrophone,
      href: "/tools/audio",
      color: "from-pink-500 to-rose-500",
      available: true,
      requiresPro: false
    },
    {
      title: "MEMU",
      description: "Create and run AI workflows with a visual editor",
      icon: FaRobot,
      href: "/tools/memu",
      color: "from-indigo-500 to-purple-500",
      available: true,
      requiresPro: true
    },
    {
      title: "Image Generator",
      description: "Create stunning AI-generated images from text prompts",
      icon: FaImage,
      href: "/tools/create",
      color: "from-purple-500 to-pink-500",
      available: true,
      requiresPro: false
    },
    {
      title: "Image Editor",
      description: "Edit images with text overlays and AI-powered enhancements",
      icon: FaEdit,
      href: "/tools/image-editor",
      color: "from-orange-500 to-red-500",
      available: true,
      requiresPro: false
    },
    {
      title: "Video Effects",
      description: "Generate captivating videos with AI-powered effects",
      icon: FaVideo,
      href: "/tools/video-effects",
      color: "from-blue-500 to-cyan-500",
      available: true,
      requiresPro: false
    },
    {
      title: "Text Analyzer",
      description: "Scripts, descriptions, tweets, bios, summaries & quizzes",
      icon: FaFileAlt,
      href: "/tools/text-analyzer",
      color: "from-green-500 to-teal-500",
      available: true,
      requiresPro: false
    },


  ];

  return (
    <div className="h-full w-full max-w-7xl mx-auto py-8 px-4 flex flex-col">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-jade to-blue-600 bg-clip-text text-transparent">
          Welcome to Your Studio{isLoaded && `, ${username}`}!
        </h1>
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
          Your creative AI workspace. Generate images, create videos, and analyze text with the power of AI.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Mana Points Card */}
        <div className="bg-gradient-to-br from-jade/10 to-jade/5 rounded-2xl p-6 border border-jade/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-jade/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-base-content/70">Mana Points</h3>
              <FaStar className="text-jade" />
            </div>
            <div className="text-3xl font-bold text-jade mb-1">
              {is_loading_tokens ? (
                <span className="loading loading-spinner loading-sm" />
              ) : token_error ? (
                <span className="text-error">--</span>
              ) : (
                mp_tokens
              )}
            </div>
            <p className="text-xs text-base-content/60">Available credits</p>
          </div>
        </div>

        {/* Plan Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-base-content/70">Current Plan</h3>
              <FaRocket className="text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-500 mb-1">
              {plan || "Free"}
            </div>
            <p className="text-xs text-base-content/60">Active subscription</p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl p-6 border border-orange-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-base-content/70">Get More MP</h3>
              <FaCoins className="text-orange-500" />
            </div>
            <Link 
              href="/buy-tokens"
              className="btn btn-sm btn-primary w-full bg-gradient-to-r from-orange-500 to-yellow-500 border-0 text-white hover:opacity-90"
            >
              Buy Tokens
            </Link>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-6">Available Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isLocked = tool.requiresPro && plan === 'free';
            
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative bg-base-100 rounded-2xl p-6 border border-base-300 hover:border-jade/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${(!tool.available || isLocked) && 'opacity-50 cursor-not-allowed'}`}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    window.location.href = '/pricing';
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"
                     style={{backgroundImage: `linear-gradient(to bottom right, ${tool.color.split(' ')[1].replace('to-', '')}, ${tool.color.split(' ')[3]})`}} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  
                  {isLocked && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-warning text-warning-content rounded-full p-2">
                        <FaLock className="text-sm" />
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-jade transition-colors flex items-center gap-2">
                    {tool.title}
                    {isLocked && <span className="badge badge-warning badge-sm">Pro</span>}
                  </h3>
                  
                  <p className="text-sm text-base-content/70">
                    {tool.description}
                  </p>

                  {!tool.available && (
                    <div className="absolute inset-0 bg-base-100/80 rounded-2xl flex items-center justify-center">
                      <span className="text-sm font-medium">Coming Soon</span>
                    </div>
                  )}
                  
                  {isLocked && (
                    <p className="text-xs text-warning mt-2">Upgrade to Standard to unlock</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-jade/5 to-blue-500/5 rounded-2xl p-6 border border-jade/10">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FaStar className="text-jade" />
          Pro Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-base-content/70">
          <div>
            • Use descriptive prompts for better AI-generated content
          </div>
          <div>
            • Each tool uses Mana Points (MP) based on complexity
          </div>
          <div>
            • Save your favorite creations to build your portfolio
          </div>
          <div>
            • Upgrade your plan for more MP and premium features
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { LucideIcon, Sparkles, ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import React from "react";

interface HeroSectionProps {
  // Content props
  badge?: {
    text: string;
    icon?: LucideIcon;
  };
  title: string;
  subtitle: string;
  description?: string;
  
  // CTA Button props
  primaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  
  // Styling props
  theme?: "jade" | "blue" | "purple" | "rose" | "amber";
  backgroundEffects?: boolean;
  maxWidth?: string;
  minHeight?: string;
  
  // Additional customization
  showAuthButtons?: boolean;
  customButtons?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const themeClasses = {
  jade: {
    gradient: "from-emerald-600 via-teal-600 to-emerald-800 dark:from-jade-dark dark:via-jade dark:to-jade-dark",
    bgEffect: "from-jade/5 to-blackflame/5",
    badge: "bg-jade/10 dark:bg-jade/20 text-jade",
    primaryButton: "from-jade to-jade-dark",
    primaryButtonHover: "from-jade-dark to-jade",
    secondaryButton: "text-jade dark:text-jade-dark border-jade dark:border-jade-dark hover:bg-jade/10 dark:hover:bg-jade/20",
    orb1: "bg-jade/20",
    orb2: "bg-blackflame/20",
  },
  blue: {
    gradient: "from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600",
    bgEffect: "from-blue-500/5 to-blue-700/5",
    badge: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-500",
    primaryButton: "from-blue-500 to-blue-600",
    primaryButtonHover: "from-blue-600 to-blue-500",
    secondaryButton: "text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20",
    orb1: "bg-blue-500/20",
    orb2: "bg-blue-700/20",
  },
  purple: {
    gradient: "from-purple-600 via-purple-700 to-purple-800 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600",
    bgEffect: "from-purple-500/5 to-purple-700/5",
    badge: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-500",
    primaryButton: "from-purple-500 to-purple-600",
    primaryButtonHover: "from-purple-600 to-purple-500",
    secondaryButton: "text-purple-500 dark:text-purple-400 border-purple-500 dark:border-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-500/20",
    orb1: "bg-purple-500/20",
    orb2: "bg-purple-700/20",
  },
  rose: {
    gradient: "from-rose-600 via-rose-700 to-rose-800 dark:from-rose-400 dark:via-rose-500 dark:to-rose-600",
    bgEffect: "from-rose-500/5 to-rose-700/5",
    badge: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-500",
    primaryButton: "from-rose-500 to-rose-600",
    primaryButtonHover: "from-rose-600 to-rose-500",
    secondaryButton: "text-rose-500 dark:text-rose-400 border-rose-500 dark:border-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20",
    orb1: "bg-rose-500/20",
    orb2: "bg-rose-700/20",
  },
  amber: {
    gradient: "from-amber-600 via-amber-700 to-amber-800 dark:from-amber-400 dark:via-amber-500 dark:to-amber-600",
    bgEffect: "from-amber-500/5 to-amber-700/5",
    badge: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500",
    primaryButton: "from-amber-500 to-amber-600",
    primaryButtonHover: "from-amber-600 to-amber-500",
    secondaryButton: "text-amber-500 dark:text-amber-400 border-amber-500 dark:border-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20",
    orb1: "bg-amber-500/20",
    orb2: "bg-amber-700/20",
  },
};

export default function HeroSection({
  badge = {
    text: "AI-Powered Creative Studio",
    icon: Sparkles,
  },
  title = "Studio.Moikas",
  subtitle = "Transform your ideas into stunning visuals with cutting-edge AI.",
  description = "Fast • Flexible • Professional",
  primaryCTA = {
    text: "Start Creating",
    href: "/tools",
    onClick: () => track("Landing-HERO-Start_Creating-Click"),
    icon: ArrowRight,
  },
  secondaryCTA = {
    text: "View Pricing",
    href: "/pricing",
  },
  theme = "jade",
  backgroundEffects = true,
  maxWidth = "max-w-4xl",
  minHeight = "min-h-[500px]",
  showAuthButtons = true,
  customButtons,
  footer,
  className = "",
}: HeroSectionProps) {
  const BadgeIcon = badge.icon || Sparkles;
  const PrimaryIcon = primaryCTA?.icon || ArrowRight;
  const themeStyles = themeClasses[theme];

  return (
    <section className={`w-full ${minHeight} flex flex-col items-center justify-center text-center pt-16 pb-12 px-4 relative overflow-hidden ${className}`}>
      {/* Background Effects */}
      {backgroundEffects && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${themeStyles.bgEffect} dark:${themeStyles.bgEffect} z-0`}></div>
          <div className={`absolute -top-40 -right-40 w-80 h-80 ${themeStyles.orb1} rounded-full filter blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${themeStyles.orb2} rounded-full filter blur-3xl animate-pulse delay-1000`}></div>
        </>
      )}

      <div className={`relative z-10 ${maxWidth} mx-auto`}>
        {/* Badge */}
        {badge && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${themeStyles.badge} rounded-full text-xs font-medium mb-4 animate-fade-in`}>
            <BadgeIcon className="w-3 h-3" />
            {badge.text}
          </div>
        )}
        
        {/* Title */}
        <h1 className={`text-5xl md:text-6xl font-extrabold tracking-tight dark:text-white mb-4 bg-gradient-to-r ${themeStyles.gradient} bg-clip-text animate-fade-in`}>
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in animation-delay-200">
          {subtitle}
          {description && (
            <span className="block mt-1 text-base text-gray-600 dark:text-gray-400">{description}</span>
          )}
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in animation-delay-400">
          {customButtons ? (
            customButtons
          ) : showAuthButtons ? (
            <>
              <SignedIn>
                {primaryCTA && (
                  <Link href={primaryCTA.href}>
                    <button
                      className={`group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-base dark:text-white bg-gradient-to-r ${themeStyles.primaryButton} rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden`}
                      onClick={primaryCTA.onClick}
                    >
                      <span className={`absolute inset-0 bg-gradient-to-r ${themeStyles.primaryButtonHover} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
                      <span className="relative flex items-center">
                        {primaryCTA.text}
                        <PrimaryIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </Link>
                )}
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">
                  <button
                    className={`group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-base dark:text-white bg-gradient-to-r ${themeStyles.primaryButton} rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden`}
                    onClick={() => track("Landing-HERO-Get_Started-Click")}
                  >
                    <span className={`absolute inset-0 bg-gradient-to-r ${themeStyles.primaryButtonHover} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
                    <span className="relative flex items-center">
                      Get Started Free
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
                {secondaryCTA && (
                  <Link href={secondaryCTA.href}>
                    <button className={`group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium ${themeStyles.secondaryButton} bg-transparent border-2 rounded-full transition-all duration-300`}>
                      {secondaryCTA.text}
                    </button>
                  </Link>
                )}
              </SignedOut>
            </>
          ) : (
            <>
              {primaryCTA && (
                <Link href={primaryCTA.href}>
                  <button
                    className={`group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-base dark:text-white bg-gradient-to-r ${themeStyles.primaryButton} rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden`}
                    onClick={primaryCTA.onClick}
                  >
                    <span className={`absolute inset-0 bg-gradient-to-r ${themeStyles.primaryButtonHover} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></span>
                    <span className="relative flex items-center">
                      {primaryCTA.text}
                      <PrimaryIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
              )}
              {secondaryCTA && (
                <Link href={secondaryCTA.href}>
                  <button 
                    className={`group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium ${themeStyles.secondaryButton} bg-transparent border-2 rounded-full transition-all duration-300`}
                    onClick={secondaryCTA.onClick}
                  >
                    {secondaryCTA.text}
                  </button>
                </Link>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="mt-6 animate-fade-in animation-delay-600">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}
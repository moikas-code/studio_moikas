"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HeroSection from "../components/common/HeroSection";
import AnimatedDemoSection from "../components/AnimatedDemoSection";
import HowItWorksSection from "../components/HowItWorksSection";
import FeaturesSection from "../components/FeaturesSection";
import UseCasesSection from "../components/UseCasesSection";
import TechnologySection from "../components/TechnologySection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/common/CTASection";
import PricingSection from "../components/PricingSection";
import FAQSection from "../components/common/FAQSection";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect logged-in users to tools page
    if (isLoaded && user) {
      router.push("/tools");
    }
  }, [isLoaded, user, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-jade/5 via-white to-jade/5 dark:from-blackflame dark:via-[#0a0a0a] dark:to-blackflame">
        <div className="loading loading-spinner loading-lg text-jade"></div>
      </div>
    );
  }

  // If user is logged in, they will be redirected (but show loading in case of delay)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-jade/5 via-white to-jade/5 dark:from-blackflame dark:via-[#0a0a0a] dark:to-blackflame">
        <div className="loading loading-spinner loading-lg text-jade"></div>
      </div>
    );
  }

  // Show landing page for non-logged-in users
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-jade/5 via-white to-jade/5 dark:from-blackflame dark:via-[#0a0a0a] dark:to-blackflame">
      <HeroSection title={"Studio.Moikas"} subtitle={"Transform your ideas into stunning visuals with cutting-edge AI."} />
      <AnimatedDemoSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection />
      <TechnologySection />
      <TestimonialsSection />
      <CTASection />
      <PricingSection />
      <FAQSection />
    </div>
  );
}
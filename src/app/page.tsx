"use client";
import HeroSection from "./components/common/HeroSection";
import AnimatedDemoSection from "./components/AnimatedDemoSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturesSection from "./components/FeaturesSection";
import UseCasesSection from "./components/UseCasesSection";
import TechnologySection from "./components/TechnologySection";
import TestimonialsSection from "./components/TestimonialsSection";
import CTASection from "./components/common/CTASection";
import PricingSection from "./components/PricingSection";
import FAQSection from "./components/common/FAQSection";

export default function Home() {
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
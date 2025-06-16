"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MacHeroSection from "../components/landing/MacHeroSection";
import MacDemoShowcase from "../components/landing/MacDemoShowcase";
import MacFeatureGrid from "../components/landing/MacFeatureGrid";
import MacPricingTable from "../components/landing/MacPricingTable";
import MacFooter from "../components/landing/MacFooter";

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="loading loading-spinner loading-lg text-jade"></div>
      </div>
    );
  }

  // If user is logged in, they will be redirected (but show loading in case of delay)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="loading loading-spinner loading-lg text-jade"></div>
      </div>
    );
  }

  // Show landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <MacHeroSection />
      <MacDemoShowcase />
      <MacFeatureGrid />
      <MacPricingTable />
      <MacFooter />
    </div>
  );
}

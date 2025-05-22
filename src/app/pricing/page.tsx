import { PricingTable } from '@clerk/nextjs';
import Link from "next/link";

/**
 * Pricing page for Studio.Moikas
 * Explains free and standard plans and upgrade instructions.
 */
export default function Pricing_page() {
  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-base-100 p-4">
      <PricingTable
        appearance={{
          elements: {
            pricingTable: "max-w-2xl w-full flex flex-col md:flex-row gap-4",
            pricingTableCard: "w-full",
            pricingTablePlanCard: "flex-1 min-w-0 w-100 p-4 md:p-6 rounded-lg shadow-md",
            pricingTablePlanCardTitle: "text-lg md:text-2xl font-bold",
            pricingTablePlanCardPrice: "text-2xl md:text-3xl font-bold",
            formButtonPrimary: "btn btn-primary btn-sm md:btn-md w-full mt-4",
            
          },
        }}
      />
      <div className="mt-6">
        <Link href="/buy-tokens" className="btn btn-primary">
          Buy More Tokens
        </Link>
      </div>
    </div>
  );
} 
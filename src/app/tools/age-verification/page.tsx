import { Metadata } from "next";
import AgeVerificationClient from "./age-verification-client";

export const metadata: Metadata = {
  title: "Age Verification | Studio Moikas",
  description: "Verify your age to access Studio Moikas",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AgeVerificationPage() {
  return <AgeVerificationClient />;
}

import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Studio Moikas",
  description: "Create your Studio Moikas account and start generating AI content",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Clerk SignUp component for user registration */}
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}

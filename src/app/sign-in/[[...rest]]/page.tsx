import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Studio Moikas",
  description: "Sign in to your Studio Moikas account",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}

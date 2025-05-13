import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Clerk SignUp component for user registration */}
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
} 
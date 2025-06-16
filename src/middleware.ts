import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { check_age_verification } from "@/lib/utils/auth/age_verification";

const is_protected_route = createRouteMatcher(["/tools(.*)"]);

const is_age_verification_route = createRouteMatcher(["/tools/age-verification"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if this is a protected route
  if (is_protected_route(req)) {
    // First, ensure user is authenticated
    const { userId } = await auth.protect();

    // Skip age verification check for the age verification page itself
    if (!is_age_verification_route(req) && userId) {
      try {
        // Use the comprehensive age verification check that includes database fallback
        const verification_status = await check_age_verification();

        if (!verification_status.is_verified && verification_status.needs_verification) {
          // Redirect to age verification with return URL
          const return_url = req.nextUrl.pathname + req.nextUrl.search;
          const verification_url = new URL("/tools/age-verification", req.url);
          verification_url.searchParams.set("return_url", return_url);

          return NextResponse.redirect(verification_url);
        }
      } catch (error) {
        console.error("Age verification check failed in middleware:", error);

        // Fallback to Clerk metadata check only if database check fails
        const { sessionClaims } = await auth();
        const public_metadata = sessionClaims?.publicMetadata as
          | { age_verified?: boolean }
          | undefined;
        const age_verified = public_metadata?.age_verified;

        if (!age_verified) {
          const return_url = req.nextUrl.pathname + req.nextUrl.search;
          const verification_url = new URL("/tools/age-verification", req.url);
          verification_url.searchParams.set("return_url", return_url);

          return NextResponse.redirect(verification_url);
        }
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

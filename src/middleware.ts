import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const is_protected_route = createRouteMatcher(["/tools(.*)"]);

const is_age_verification_route = createRouteMatcher(["/tools/age-verification"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  // Check if this is a protected route
  if (is_protected_route(req)) {
    // First, ensure user is authenticated
    await auth.protect();

    // Skip age verification check for the age verification page itself
    if (!is_age_verification_route(req) && userId) {
      // Check if user has verified their age
      const age_verified = sessionClaims?.publicMetadata?.age_verified as boolean | undefined;

      if (!age_verified) {
        // Redirect to age verification with return URL
        const return_url = req.nextUrl.pathname + req.nextUrl.search;
        const verification_url = new URL("/tools/age-verification", req.url);
        verification_url.searchParams.set("return_url", return_url);

        return NextResponse.redirect(verification_url);
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

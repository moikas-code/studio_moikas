import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { check_age_verification } from "@/lib/utils/auth/age_verification";
import { check_user_banned } from "@/lib/utils/auth/ban_check";

const is_protected_route = createRouteMatcher(["/tools(.*)"]);

const is_age_verification_route = createRouteMatcher(["/tools/age-verification"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if user is banned (for all routes)
  const { userId } = await auth();
  if (userId) {
    const ban_status = await check_user_banned(req);
    if (ban_status.is_banned) {
      // Return error page for banned users
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Access Denied - Studio Moikas</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #0f0f0f;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                max-width: 600px;
              }
              h1 { color: #ff4444; margin-bottom: 20px; }
              p { color: #cccccc; line-height: 1.6; margin-bottom: 15px; }
              .reason { 
                background-color: #1a1a1a; 
                padding: 15px; 
                border-radius: 8px; 
                border-left: 4px solid #ff4444;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Access Permanently Denied</h1>
              <p>Your access to Studio Moikas has been permanently revoked.</p>
              <div class="reason">
                <p><strong>Reason:</strong> ${ban_status.ban_reason || "Terms of Service violation"}</p>
              </div>
              <p>This decision is final and cannot be appealed.</p>
            </div>
          </body>
        </html>`,
        {
          status: 403,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }

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

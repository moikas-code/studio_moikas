import { currentUser } from "@clerk/nextjs/server";
import { api_error } from "./response";
import { check_age_verification } from "../auth/age_verification";
import { NextResponse } from "next/server";

/**
 * Middleware helper to require age verification for API routes
 * Returns null if verified, or an error response if not
 */
export async function require_age_verification(): Promise<NextResponse | null> {
  try {
    const user = await currentUser();

    if (!user) {
      return api_error("Unauthorized", 401);
    }

    const { is_verified, needs_verification } = await check_age_verification();

    if (needs_verification && !is_verified) {
      return api_error(
        "Age verification required. Please verify your age to access this feature.",
        403,
        "AGE_VERIFICATION_REQUIRED"
      );
    }

    // User is verified
    return null;
  } catch (error) {
    console.error("Age verification check failed:", error);
    return api_error("Failed to verify age status", 500);
  }
}

/**
 * Wrapper function for API route handlers that require age verification
 */
export function with_age_verification<T extends (...args: unknown[]) => unknown>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const verification_error = await require_age_verification();
    if (verification_error) {
      return verification_error;
    }

    return handler(...args);
  }) as T;
}

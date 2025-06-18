"use client";
import React, { useState } from "react";
import { Calendar, AlertCircle, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface AgeVerificationFormProps {
  onComplete?: () => void;
}

export default function AgeVerificationForm({ onComplete }: AgeVerificationFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [birth_date, set_birth_date] = useState("");
  const [region, set_region] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState("");

  const get_min_age = () => {
    return 18; // All users must be 18+
  };

  const calculate_age = (birth_date: string) => {
    const birth = new Date(birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month_diff = today.getMonth() - birth.getMonth();

    if (month_diff < 0 || (month_diff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const wait_for_verification = async (max_attempts = 6): Promise<boolean> => {
    for (let attempt = 1; attempt <= max_attempts; attempt++) {
      try {
        console.log(`Checking verification status, attempt ${attempt}/${max_attempts}`);

        // Try to get fresh token from Clerk
        await getToken({ skipCache: true });

        // Check verification status via API
        const check_response = await fetch("/api/auth/verify-age", {
          method: "GET",
        });

        if (check_response.ok) {
          const check_data = await check_response.json();
          if (check_data.verified) {
            console.log("Verification confirmed via API");
            return true;
          }
        }

        // Wait with exponential backoff (500ms, 1s, 2s, 4s, 8s, 16s)
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 16000);
        console.log(`Verification not ready, waiting ${delay}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.warn(`Verification check attempt ${attempt} failed:`, error);
        // Continue with exponential backoff even on errors
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 16000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.warn("Verification status check timed out after all attempts");
    return false;
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error("");

    // Client-side age check
    const age = calculate_age(birth_date);
    const min_age = get_min_age();

    if (age < min_age) {
      set_error(`You must be at least ${min_age} years old to use Studio Moikas`);
      return;
    }

    set_is_loading(true);

    try {
      console.log("Submitting age verification");
      const response = await fetch("/api/auth/verify-age", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birth_date,
          region: region || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Age verification failed");
      }

      console.log("Age verification submitted successfully, waiting for propagation");

      // Wait for verification to propagate through both Clerk and database
      const verification_confirmed = await wait_for_verification();

      if (verification_confirmed) {
        console.log("Verification confirmed, redirecting");
        // Success - redirect to tools or call completion handler
        if (onComplete) {
          onComplete();
        } else {
          router.push("/tools");
        }
      } else {
        console.log("Verification timeout, forcing page reload");
        // If verification doesn't confirm within reasonable time, force reload
        // The database should have the verification, middleware will handle fallback
        window.location.href = onComplete ? window.location.href : "/tools";
      }
    } catch (err) {
      console.error("Age verification error:", err);
      set_error(err instanceof Error ? err.message : "Age verification failed");
    } finally {
      set_is_loading(false);
    }
  };

  // Get max date (today)
  const get_max_date = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get min date (150 years ago)
  const get_min_date = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 150);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-semibold">Age Verification Required</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Verify Your Age</h2>
        <p className="text-base-content/70">
          To comply with legal requirements, we need to verify that you meet the minimum age
          requirement.
        </p>
      </div>

      <form onSubmit={handle_submit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Birth Date</label>
          <input
            type="date"
            value={birth_date}
            onChange={(e) => set_birth_date(e.target.value)}
            max={get_max_date()}
            min={get_min_date()}
            required
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Your Region (Optional)
          </label>
          <select
            value={region}
            onChange={(e) => set_region(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">Select your region...</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <optgroup label="European Union">
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
              <option value="SE">Sweden</option>
              <option value="DK">Denmark</option>
              <option value="FI">Finland</option>
              <option value="AT">Austria</option>
              <option value="PL">Poland</option>
              <option value="IE">Ireland</option>
              <option value="GR">Greece</option>
              <option value="PT">Portugal</option>
              <option value="CZ">Czech Republic</option>
              <option value="HU">Hungary</option>
              <option value="RO">Romania</option>
              <option value="BG">Bulgaria</option>
              <option value="HR">Croatia</option>
              <option value="SK">Slovakia</option>
              <option value="SI">Slovenia</option>
              <option value="LT">Lithuania</option>
              <option value="LV">Latvia</option>
              <option value="EE">Estonia</option>
              <option value="CY">Cyprus</option>
              <option value="LU">Luxembourg</option>
              <option value="MT">Malta</option>
            </optgroup>
            <option value="OTHER">Other</option>
          </select>
          <p className="text-sm text-base-content/60 mt-1">
            All users must be at least 18 years old
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-base-200 rounded-lg p-4">
          <p className="text-sm text-base-content/70 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Minimum age: {get_min_age()} years old</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={is_loading || !birth_date}
          className="btn btn-primary w-full"
        >
          {is_loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Verifying and syncing...
            </>
          ) : (
            "Verify Age"
          )}
        </button>
      </form>

      <p className="text-xs text-base-content/60 text-center mt-6">
        Your birth date is used only for age verification and is stored securely. See our{" "}
        <a href="/privacy-policy" className="link link-primary">
          Privacy Policy
        </a>{" "}
        for details.
      </p>
    </div>
  );
}

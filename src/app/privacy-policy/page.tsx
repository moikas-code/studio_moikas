"use client"
import React from "react";

export default function Privacy_policy_page() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        Studio Moikas values your privacy. We use analytics to understand how our site is used and to improve your experience. Analytics data may include information such as pages visited, session duration, and interactions with the site. No personally identifiable information is collected unless explicitly provided by you.
      </p>
      <h2 className="text-xl font-semibold mb-2">Analytics Tracking</h2>
      <p className="mb-4">
        We use Vercel Analytics to collect anonymous usage data. You can opt out of analytics tracking at any time by using the toggle at the bottom of the page. When you opt out, no analytics data will be sent from your browser.
      </p>
      <h2 className="text-xl font-semibold mb-2">Your Choices</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You can opt out of analytics tracking at any time using the toggle in the site footer.</li>
        <li>You may contact us if you have questions about your data or privacy.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-2">Contact</h2>
      <p>
        For any privacy-related questions, please contact Moikapy on X at <a href="https://x.com/moikapy_" className="underline">https://x.com/moikapy_</a>.
      </p>
    </div>
  );
} 
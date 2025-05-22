"use client";
import React from "react";

export default function Cookie_consent_banner() {
  const [visible, set_visible] = React.useState(false);

  React.useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      set_visible(true);
    }
  }, []);

  const handle_accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    set_visible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 flex flex-col md:flex-row items-center justify-center z-50 shadow-lg">
      <span className="mb-2 md:mb-0 md:mr-4">
        We use cookies and analytics to improve your experience. By using this site, you agree to our use of cookies. See our {" "}
        <a href="/privacy-policy" className="underline text-primary">Privacy Policy</a>.
      </span>
      <button
        onClick={handle_accept}
        className="ml-0 md:ml-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        Accept
      </button>
    </div>
  );
} 
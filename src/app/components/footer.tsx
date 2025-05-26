import Analytics_opt_out_toggle from "./analytics_opt_out_toggle";

export default function Footer() {

return (
  <footer className="w-full p-4 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
    <Analytics_opt_out_toggle />
    {" | "}
    <a href="/privacy-policy" className="underline hover:text-primary">
      Privacy Policy
    </a>
    {" | "}
    <a href="/terms-of-service" className="underline hover:text-primary">
      Terms of Service
    </a>
  </footer>
);
}
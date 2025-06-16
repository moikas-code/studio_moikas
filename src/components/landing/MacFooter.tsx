"use client";
import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "API Docs", href: "#" },
    { name: "Changelog", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Contact", href: "/contact/privacy" },
    { name: "Support", href: "#" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "DMCA", href: "/dmca" },
    { name: "Cookie Policy", href: "#" },
  ],
  Resources: [
    { name: "Documentation", href: "#" },
    { name: "Discord", href: "#" },
    { name: "Status", href: "#" },
    { name: "GitHub", href: "#" },
  ],
};

const socialLinks = [
  { name: "GitHub", icon: Github, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Email", icon: Mail, href: "mailto:support@studio.moikas.com" },
];

export default function MacFooter() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Studio Moikas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              AI-powered creative tools for everyone.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 rounded-xl glass dark:glass-dark flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-jade hover:shadow-macos transition-all duration-300"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Studio Moikas. All rights reserved.
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 glass dark:glass-dark rounded-full">
            <div className="w-2 h-2 bg-jade rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const daisyui = require("daisyui");

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        black: "#191a20",
        white: "#ffffff",
        jade: {
          DEFAULT: "#00c48c",
          dark: "#009e6d",
        },
        blackflame: {
          DEFAULT: "#22223b",
          light: "#2c2c44",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        wiggle: "wiggle 3s ease-in-out infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "fade-in": "fade-in 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), daisyui],
  daisyui: {
    themes: [
      {
        web: {
          primary: "#00c48c", // jade
          secondary: "#22223b", // blackflame
          accent: "#00c48c", // jade
          neutral: "#191a20", // black
          "base-100": "#191a20", // main background
          "base-200": "#22223b", // card background
          "base-300": "#2c2c44", // subtle contrast
          info: "#00c48c",
          success: "#00c48c",
          warning: "#ffd700",
          error: "#e53e3e",
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-text-case": "none",
          "--btn-focus-scale": "0.98",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
    darkTheme: "web",
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: "",
  },
};
